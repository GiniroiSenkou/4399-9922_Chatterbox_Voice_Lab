from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class TimelineClipCreate(BaseModel):
    voice_id: str | None = None
    text: str = Field(..., min_length=1)
    model: str = Field("turbo", pattern="^(turbo|standard|multilingual)$")
    params: dict | None = None
    order_index: int = 0
    track: int = 0
    speaker_label: str | None = None


class TimelineClipUpdate(BaseModel):
    voice_id: str | None = None
    text: str | None = None
    model: str | None = None
    params: dict | None = None
    order_index: int | None = None
    track: int | None = None
    speaker_label: str | None = None


class TimelineClipResponse(BaseModel):
    id: str
    project_id: str
    voice_id: str | None
    generation_id: str | None
    text: str
    model: str
    params: dict | None
    order_index: int
    track: int
    start_ms: int
    speaker_label: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    settings: dict | None = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str | None
    settings: dict | None
    clips: list[TimelineClipResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectListResponse(BaseModel):
    projects: list[ProjectResponse]
    total: int
