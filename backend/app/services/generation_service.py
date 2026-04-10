from __future__ import annotations

import asyncio
import json
import logging
import time
from pathlib import Path

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.events import event_bus
from app.core.exceptions import GenerationNotFoundError, VoiceNotFoundError
from app.core.storage import generate_id
from app.models.generation import Generation
from app.models.voice_profile import VoiceProfile
from app.schemas.generation import GenerateRequest, GenerateABRequest, GenerationParams
from app.services.engine_manager import EngineManager
from app.utils.paralinguistic import prepare_text_for_model

logger = logging.getLogger(__name__)


class GenerationService:
    def __init__(self, db: AsyncSession, engine: EngineManager) -> None:
        self.db = db
        self.engine = engine

    async def _get_voice(self, voice_id: str) -> VoiceProfile:
        result = await self.db.execute(
            select(VoiceProfile).where(VoiceProfile.id == voice_id)
        )
        voice = result.scalar_one_or_none()
        if not voice:
            raise VoiceNotFoundError(voice_id)
        return voice

    async def generate(self, request: GenerateRequest) -> str:
        """Submit a generation job. Returns job_id."""
        voice = await self._get_voice(request.voice_id)
        params_payload = request.params.model_dump()
        if request.preset_name:
            params_payload["_preset_name"] = request.preset_name
        params_payload["_voice_name"] = voice.name
        if voice.language:
            params_payload["_voice_language"] = voice.language

        gen_id = generate_id()
        generation = Generation(
            id=gen_id,
            voice_id=request.voice_id,
            text=request.text,
            model=request.model,
            params=json.dumps(params_payload),
            status="queued",
        )
        self.db.add(generation)
        await self.db.flush()

        await event_bus.publish("generation:queued", {"job_id": gen_id})

        # Launch generation in background
        asyncio.create_task(
            self._run_generation(gen_id, request.text, voice.file_path, request.model, request.params)
        )

        return gen_id

    async def generate_ab(self, request: GenerateABRequest) -> tuple[str, str, str]:
        """Submit A/B comparison. Returns (job_id_a, job_id_b, ab_pair_id)."""
        voice = await self._get_voice(request.voice_id)
        params_payload = request.params.model_dump()
        if request.preset_name:
            params_payload["_preset_name"] = request.preset_name
        params_payload["_voice_name"] = voice.name
        if voice.language:
            params_payload["_voice_language"] = voice.language
        ab_pair_id = generate_id()

        gen_id_a = generate_id()
        gen_a = Generation(
            id=gen_id_a,
            voice_id=request.voice_id,
            text=request.text,
            model=request.model_a,
            params=json.dumps(params_payload),
            status="queued",
            ab_pair_id=ab_pair_id,
        )

        gen_id_b = generate_id()
        gen_b = Generation(
            id=gen_id_b,
            voice_id=request.voice_id,
            text=request.text,
            model=request.model_b,
            params=json.dumps(params_payload),
            status="queued",
            ab_pair_id=ab_pair_id,
        )

        self.db.add(gen_a)
        self.db.add(gen_b)
        await self.db.flush()

        # Launch both sequentially (share model lock)
        asyncio.create_task(
            self._run_ab_generations(
                gen_id_a, gen_id_b,
                request.text, voice.file_path,
                request.model_a, request.model_b,
                request.params,
            )
        )

        return gen_id_a, gen_id_b, ab_pair_id

    async def _run_generation(
        self, gen_id: str, text: str, voice_path: str, model: str, params: GenerationParams
    ) -> None:
        """Background task to run TTS generation."""
        try:
            await event_bus.publish("generation:started", {
                "job_id": gen_id,
                "model": model,
            })

            # Update status
            await self._update_status(gen_id, "processing")

            param_dict = params.model_dump(exclude_none=True)
            param_dict.pop("norm_loudness", None)  # Handled separately

            prepared_text = prepare_text_for_model(text, model)

            out_path, duration_ms = await self.engine.generate(
                model_type=model,
                text=prepared_text,
                voice_path=Path(voice_path),
                generation_id=gen_id,
                **param_dict,
            )

            # Update DB
            await self._complete_generation(gen_id, str(out_path), duration_ms)

            await event_bus.publish("generation:complete", {
                "job_id": gen_id,
                "generation_id": gen_id,
                "output_url": f"/api/v1/generate/{gen_id}/audio",
                "duration_ms": duration_ms,
            })

        except Exception as e:
            logger.exception(f"Generation {gen_id} failed")
            await self._fail_generation(gen_id, str(e))
            await event_bus.publish("generation:failed", {
                "job_id": gen_id,
                "error": str(e),
            })

    async def _run_ab_generations(
        self,
        gen_id_a: str,
        gen_id_b: str,
        text: str,
        voice_path: str,
        model_a: str,
        model_b: str,
        params: GenerationParams,
    ) -> None:
        """Run A/B comparison generations sequentially."""
        param_dict = params.model_dump(exclude_none=True)
        param_dict.pop("norm_loudness", None)

        for gen_id, model in [(gen_id_a, model_a), (gen_id_b, model_b)]:
            try:
                await event_bus.publish("generation:started", {"job_id": gen_id, "model": model})
                await self._update_status(gen_id, "processing")

                prepared_text = prepare_text_for_model(text, model)

                out_path, duration_ms = await self.engine.generate(
                    model_type=model,
                    text=prepared_text,
                    voice_path=Path(voice_path),
                    generation_id=gen_id,
                    **param_dict,
                )

                await self._complete_generation(gen_id, str(out_path), duration_ms)
                await event_bus.publish("generation:complete", {
                    "job_id": gen_id,
                    "generation_id": gen_id,
                    "output_url": f"/api/v1/generate/{gen_id}/audio",
                    "duration_ms": duration_ms,
                })
            except Exception as e:
                logger.exception(f"A/B generation {gen_id} failed")
                await self._fail_generation(gen_id, str(e))
                await event_bus.publish("generation:failed", {"job_id": gen_id, "error": str(e)})

    async def _update_status(self, gen_id: str, status: str) -> None:
        from app.core.database import async_session
        async with async_session() as session:
            result = await session.execute(
                select(Generation).where(Generation.id == gen_id)
            )
            gen = result.scalar_one_or_none()
            if gen:
                gen.status = status
                await session.commit()

    async def _complete_generation(self, gen_id: str, output_path: str, duration_ms: int) -> None:
        from app.core.database import async_session
        async with async_session() as session:
            result = await session.execute(
                select(Generation).where(Generation.id == gen_id)
            )
            gen = result.scalar_one_or_none()
            if gen:
                gen.status = "completed"
                gen.output_path = output_path
                gen.duration_ms = duration_ms
                await session.commit()

    async def _fail_generation(self, gen_id: str, error: str) -> None:
        from app.core.database import async_session
        async with async_session() as session:
            result = await session.execute(
                select(Generation).where(Generation.id == gen_id)
            )
            gen = result.scalar_one_or_none()
            if gen:
                gen.status = "failed"
                gen.error_message = error
                await session.commit()

    async def get_generation(self, gen_id: str) -> Generation:
        result = await self.db.execute(
            select(Generation).where(Generation.id == gen_id)
        )
        gen = result.scalar_one_or_none()
        if not gen:
            raise GenerationNotFoundError(gen_id)
        return gen

    async def list_generations(
        self, offset: int = 0, limit: int = 50
    ) -> tuple[list[Generation], int]:
        query = select(Generation).order_by(Generation.created_at.desc())
        count_q = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_q)).scalar() or 0

        query = query.offset(offset).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def delete_generation(self, gen_id: str) -> None:
        gen = await self.get_generation(gen_id)
        if gen.output_path:
            Path(gen.output_path).unlink(missing_ok=True)
        await self.db.delete(gen)
        await self.db.flush()

    async def delete_history(self) -> int:
        """Delete completed generations and their output files."""
        result = await self.db.execute(
            select(Generation).where(Generation.status == "completed")
        )
        generations = list(result.scalars().all())

        for gen in generations:
            if gen.output_path:
                Path(gen.output_path).unlink(missing_ok=True)
            await self.db.delete(gen)

        await self.db.flush()
        return len(generations)
