from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.generation import GenerationParams


class PresetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    model: str = Field("turbo", pattern="^(turbo|standard|multilingual)$")
    params: GenerationParams


class PresetUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    model: str | None = None
    params: GenerationParams | None = None


class PresetResponse(BaseModel):
    id: str
    name: str
    description: str | None
    model: str
    params: dict
    is_default: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PresetListResponse(BaseModel):
    presets: list[PresetResponse]
    total: int
