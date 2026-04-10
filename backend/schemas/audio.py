from __future__ import annotations

from pydantic import BaseModel, Field


class AudioOperation(BaseModel):
    type: str  # normalize, denoise, trim_silence, fade_in, fade_out, eq, compress
    params: dict = {}


class AudioProcessRequest(BaseModel):
    input_path: str
    operations: list[AudioOperation] = []
    output_format: str = Field("wav", pattern="^(wav|mp3|flac)$")


class AudioConcatRequest(BaseModel):
    file_ids: list[str]
    crossfade_ms: int = Field(50, ge=0, le=1000)
    output_format: str = Field("wav", pattern="^(wav|mp3|flac)$")


class AudioInfoResponse(BaseModel):
    duration_ms: int
    sample_rate: int
    channels: int
    format: str
    file_size_bytes: int
