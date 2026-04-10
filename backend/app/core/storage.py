from __future__ import annotations

import uuid
from pathlib import Path

from app.config import settings


def generate_id() -> str:
    return str(uuid.uuid4())


def voice_path(voice_id: str) -> Path:
    return settings.voices_dir / f"{voice_id}.wav"


def output_path(generation_id: str) -> Path:
    return settings.outputs_dir / f"{generation_id}.wav"


def temp_path(suffix: str = ".wav") -> Path:
    return settings.storage_root / "tmp" / f"{uuid.uuid4()}{suffix}"


def ensure_temp_dir() -> None:
    (settings.storage_root / "tmp").mkdir(parents=True, exist_ok=True)
