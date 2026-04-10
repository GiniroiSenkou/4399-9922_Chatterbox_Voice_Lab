from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class VoiceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    tags: list[str] | None = None
    language: str | None = None


class VoiceUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    tags: list[str] | None = None
    language: str | None = None


class VoiceResponse(BaseModel):
    id: str
    name: str
    description: str | None
    tags: list[str] | None
    original_filename: str | None
    file_format: str
    sample_rate: int
    duration_ms: int
    language: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VoiceListResponse(BaseModel):
    voices: list[VoiceResponse]
    total: int
