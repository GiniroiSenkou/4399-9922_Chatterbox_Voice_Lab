from __future__ import annotations

import asyncio
import inspect
import logging
import time
from pathlib import Path
from typing import Any

import torch
import torchaudio

from app.config import settings
from app.core.events import event_bus
from app.core.storage import output_path

logger = logging.getLogger(__name__)

MODEL_CLASSES = {
    "turbo": ("chatterbox.tts_turbo", "ChatterboxTurboTTS"),
    "standard": ("chatterbox.tts", "ChatterboxTTS"),
    "multilingual": ("chatterbox.mtl_tts", "ChatterboxMultilingualTTS"),
}


class EngineManager:
    """Singleton manager for Chatterbox TTS models with LRU eviction."""

    def __init__(self) -> None:
        self._models: dict[str, Any] = {}
        self._locks: dict[str, asyncio.Lock] = {
            "turbo": asyncio.Lock(),
            "standard": asyncio.Lock(),
            "multilingual": asyncio.Lock(),
        }
        self._last_used: dict[str, float] = {}
        self._max_loaded = settings.max_loaded_models
        self._device = self._detect_device()
        self._loading_lock = asyncio.Lock()

        logger.info(f"EngineManager initialized: device={self._device}, max_models={self._max_loaded}")

    def _detect_device(self) -> str:
        configured = settings.device.lower()
        if configured == "cuda" and torch.cuda.is_available():
            return "cuda"
        if configured == "mps" and hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return "mps"
        if configured != "cpu":
            logger.warning(f"Requested device '{configured}' unavailable, falling back to CPU")
        return "cpu"

    @property
    def device(self) -> str:
        return self._device

    @property
    def loaded_models(self) -> list[str]:
        return list(self._models.keys())

    async def _ensure_loaded(self, model_type: str) -> Any:
        if model_type in self._models:
            self._last_used[model_type] = time.time()
            return self._models[model_type]

        async with self._loading_lock:
            # Double-check after acquiring lock
            if model_type in self._models:
                self._last_used[model_type] = time.time()
                return self._models[model_type]

            # Evict LRU if at capacity
            while len(self._models) >= self._max_loaded and self._models:
                lru_key = min(self._last_used, key=self._last_used.get)  # type: ignore
                logger.info(f"Evicting model '{lru_key}' (LRU)")
                del self._models[lru_key]
                del self._last_used[lru_key]
                if self._device == "cuda":
                    torch.cuda.empty_cache()

            # Load the model
            await event_bus.publish("engine:model_loading", {"model": model_type, "progress": 0.0})
            logger.info(f"Loading model '{model_type}' on {self._device}...")

            module_path, class_name = MODEL_CLASSES[model_type]
            model = await asyncio.to_thread(self._load_model, module_path, class_name)

            self._models[model_type] = model
            self._last_used[model_type] = time.time()

            await event_bus.publish("engine:model_ready", {"model": model_type})
            logger.info(f"Model '{model_type}' loaded successfully")

            return model

    def _load_model(self, module_path: str, class_name: str) -> Any:
        import importlib
        mod = importlib.import_module(module_path)
        cls = getattr(mod, class_name)
        return cls.from_pretrained(device=self._device)

    def _filter_generate_kwargs(
        self, model_type: str, model: Any, gen_kwargs: dict[str, Any]
    ) -> dict[str, Any]:
        try:
            sig = inspect.signature(model.generate)
        except (TypeError, ValueError):
            return gen_kwargs

        params = sig.parameters
        accepts_var_kwargs = any(
            p.kind == inspect.Parameter.VAR_KEYWORD for p in params.values()
        )
        if accepts_var_kwargs:
            return gen_kwargs

        accepted = {
            name
            for name, p in params.items()
            if name != "self"
            and p.kind in (
                inspect.Parameter.POSITIONAL_OR_KEYWORD,
                inspect.Parameter.KEYWORD_ONLY,
            )
        }

        filtered = {k: v for k, v in gen_kwargs.items() if k in accepted}
        dropped = sorted(k for k in gen_kwargs if k not in accepted)
        if dropped:
            logger.info(
                "Dropping unsupported generation params for model '%s': %s",
                model_type,
                ", ".join(dropped),
            )

        required = {
            name
            for name, p in params.items()
            if name not in {"self", "text"}
            and p.default is inspect.Parameter.empty
            and p.kind in (
                inspect.Parameter.POSITIONAL_OR_KEYWORD,
                inspect.Parameter.KEYWORD_ONLY,
            )
        }
        missing_required = sorted(k for k in required if k not in filtered)
        if missing_required:
            raise ValueError(
                f"Model '{model_type}' requires parameters: {', '.join(missing_required)}"
            )

        return filtered

    async def generate(
        self,
        model_type: str,
        text: str,
        voice_path: Path,
        generation_id: str,
        **params: Any,
    ) -> tuple[Path, int]:
        """Generate speech and return (output_path, duration_ms)."""
        if model_type not in MODEL_CLASSES:
            raise ValueError(f"Unknown model type: {model_type}")

        async with self._locks[model_type]:
            model = await self._ensure_loaded(model_type)

            await event_bus.publish("generation:progress", {
                "job_id": generation_id,
                "progress": 0.3,
                "stage": "generating",
            })

            start = time.time()

            # Build generation kwargs
            gen_kwargs: dict[str, Any] = {
                "audio_prompt_path": str(voice_path),
            }

            # Map user params to model.generate() kwargs.
            # Unsupported kwargs are filtered by signature below per model.
            for key in [
                "exaggeration",
                "cfg_weight",
                "temperature",
                "speed",
                "top_p",
                "top_k",
                "min_p",
                "repetition_penalty",
                "seed",
                "norm_loudness",
                "language_id",
            ]:
                if key in params and params[key] is not None:
                    gen_kwargs[key] = params[key]

            # Multilingual model requires language_id in current chatterbox versions.
            if model_type == "multilingual" and "language_id" not in gen_kwargs:
                gen_kwargs["language_id"] = "en"

            gen_kwargs = self._filter_generate_kwargs(model_type, model, gen_kwargs)

            # Run generation in thread (blocking PyTorch call)
            wav = await asyncio.to_thread(model.generate, text, **gen_kwargs)

            elapsed_ms = int((time.time() - start) * 1000)

            await event_bus.publish("generation:progress", {
                "job_id": generation_id,
                "progress": 0.8,
                "stage": "saving",
            })

            # Save output
            out_path = output_path(generation_id)
            out_path.parent.mkdir(parents=True, exist_ok=True)
            await asyncio.to_thread(torchaudio.save, str(out_path), wav, model.sr)

            # Calculate duration
            duration_ms = int(wav.shape[-1] / model.sr * 1000)

            return out_path, duration_ms

    async def preload(self, model_type: str) -> None:
        """Pre-load a model (called during startup or on user request)."""
        if model_type in MODEL_CLASSES:
            async with self._locks[model_type]:
                await self._ensure_loaded(model_type)

    async def get_status(self) -> dict:
        return {
            "models_loaded": self.loaded_models,
            "device": self._device,
            "max_loaded": self._max_loaded,
        }
