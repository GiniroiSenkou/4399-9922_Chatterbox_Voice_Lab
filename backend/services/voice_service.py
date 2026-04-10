from __future__ import annotations

import json
import logging
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.exceptions import VoiceNotFoundError, InvalidAudioError
from app.core.storage import generate_id, voice_path, temp_path, ensure_temp_dir
from app.models.voice_profile import VoiceProfile
from app.schemas.voice import VoiceCreate, VoiceUpdate
from app.services.audio_processor import process_voice_upload
from app.utils.audio_utils import get_audio_info, compute_waveform_peaks

logger = logging.getLogger(__name__)


class VoiceService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_voices(
        self, search: str | None = None, offset: int = 0, limit: int = 50
    ) -> tuple[list[VoiceProfile], int]:
        query = select(VoiceProfile).order_by(VoiceProfile.created_at.desc())

        if search:
            query = query.where(
                VoiceProfile.name.ilike(f"%{search}%")
                | VoiceProfile.tags.ilike(f"%{search}%")
            )

        # Count
        count_q = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_q)).scalar() or 0

        # Paginate
        query = query.offset(offset).limit(limit)
        result = await self.db.execute(query)
        voices = list(result.scalars().all())

        return voices, total

    async def get_voice(self, voice_id: str) -> VoiceProfile:
        result = await self.db.execute(
            select(VoiceProfile).where(VoiceProfile.id == voice_id)
        )
        voice = result.scalar_one_or_none()
        if not voice:
            raise VoiceNotFoundError(voice_id)
        return voice

    async def upload_voice(self, file: UploadFile, data: VoiceCreate) -> VoiceProfile:
        ensure_temp_dir()

        # Save uploaded file to temp
        suffix = Path(file.filename or "upload.wav").suffix or ".wav"
        tmp = temp_path(suffix)
        tmp.parent.mkdir(parents=True, exist_ok=True)

        content = await file.read()
        if len(content) > settings.max_upload_size_mb * 1024 * 1024:
            raise InvalidAudioError(f"File exceeds {settings.max_upload_size_mb}MB limit")

        with open(tmp, "wb") as f:
            f.write(content)

        try:
            # Validate audio
            info = await get_audio_info(tmp)
            duration_s = info["duration_ms"] / 1000.0

            if duration_s < settings.min_voice_duration_s:
                raise InvalidAudioError(
                    f"Audio too short ({duration_s:.1f}s). Minimum is {settings.min_voice_duration_s}s"
                )
            if duration_s > settings.max_voice_duration_s:
                raise InvalidAudioError(
                    f"Audio too long ({duration_s:.1f}s). Maximum is {settings.max_voice_duration_s}s"
                )

            # Generate ID and process
            vid = generate_id()
            out = voice_path(vid)
            out.parent.mkdir(parents=True, exist_ok=True)

            await process_voice_upload(tmp, out)

            # Get processed audio info
            processed_info = await get_audio_info(out)
            processed_duration_s = processed_info["duration_ms"] / 1000.0

            if processed_duration_s < settings.min_voice_duration_s:
                out.unlink(missing_ok=True)
                raise InvalidAudioError(
                    "Processed audio is too short "
                    f"({processed_duration_s:.1f}s). Minimum is {settings.min_voice_duration_s}s. "
                    "This usually means the file has too much silence. "
                    "Upload 5-60s of clear speech."
                )
            if processed_duration_s > settings.max_voice_duration_s:
                out.unlink(missing_ok=True)
                raise InvalidAudioError(
                    "Processed audio is too long "
                    f"({processed_duration_s:.1f}s). Maximum is {settings.max_voice_duration_s}s"
                )

            # Compute waveform peaks
            peaks = compute_waveform_peaks(out)

            # Create DB record
            voice = VoiceProfile(
                id=vid,
                name=data.name,
                description=data.description,
                tags=json.dumps(data.tags) if data.tags else None,
                original_filename=file.filename,
                file_path=str(out),
                file_format="wav",
                sample_rate=16000,
                duration_ms=processed_info["duration_ms"],
                waveform_peaks=json.dumps(peaks),
                language=data.language,
            )
            self.db.add(voice)
            await self.db.flush()

            logger.info(f"Voice profile created: {vid} ({data.name})")
            return voice

        finally:
            tmp.unlink(missing_ok=True)

    async def update_voice(self, voice_id: str, data: VoiceUpdate) -> VoiceProfile:
        voice = await self.get_voice(voice_id)

        if data.name is not None:
            voice.name = data.name
        if data.description is not None:
            voice.description = data.description
        if data.tags is not None:
            voice.tags = json.dumps(data.tags)
        if data.language is not None:
            voice.language = data.language

        await self.db.flush()
        return voice

    async def delete_voice(self, voice_id: str) -> None:
        voice = await self.get_voice(voice_id)

        # Delete file
        fp = Path(voice.file_path)
        fp.unlink(missing_ok=True)

        await self.db.delete(voice)
        await self.db.flush()
        logger.info(f"Voice profile deleted: {voice_id}")

    async def get_waveform(self, voice_id: str) -> list[float]:
        voice = await self.get_voice(voice_id)
        if voice.waveform_peaks:
            return json.loads(voice.waveform_peaks)
        # Recompute if missing
        peaks = compute_waveform_peaks(Path(voice.file_path))
        voice.waveform_peaks = json.dumps(peaks)
        await self.db.flush()
        return peaks
