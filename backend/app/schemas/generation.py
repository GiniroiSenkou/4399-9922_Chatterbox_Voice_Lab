from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class GenerationParams(BaseModel):
    exaggeration: float = Field(0.5, ge=0.25, le=2.0)
    cfg_weight: float = Field(0.5, ge=0.0, le=1.0)
    temperature: float = Field(0.7, ge=0.05, le=5.0)
    speed: float = Field(1.0, ge=0.5, le=2.0)
    seed: int | None = None
    top_p: float = Field(0.9, ge=0.0, le=1.0)
    top_k: int = Field(50, ge=0, le=1000)
    min_p: float = Field(0.05, ge=0.0, le=1.0)
    repetition_penalty: float = Field(1.0, ge=1.0, le=2.0)
    norm_loudness: bool = True
    language_id: str | None = None


class GenerateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    voice_id: str
    model: str = Field("turbo", pattern="^(turbo|standard|multilingual)$")
    params: GenerationParams = GenerationParams()
    preset_name: str | None = Field(None, min_length=1, max_length=255)


class GenerateABRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    voice_id: str
    params: GenerationParams = GenerationParams()
    model_a: str = Field("turbo", pattern="^(turbo|standard|multilingual)$")
    model_b: str = Field("multilingual", pattern="^(turbo|standard|multilingual)$")
    preset_name: str | None = Field(None, min_length=1, max_length=255)


class GenerateResponse(BaseModel):
    job_id: str
    status: str


class GenerateABResponse(BaseModel):
    job_id_a: str
    job_id_b: str
    model_a: str
    model_b: str
    ab_pair_id: str


class GenerationResponse(BaseModel):
    id: str
    voice_id: str
    text: str
    model: str
    params: dict | None
    output_path: str | None
    duration_ms: int
    processing_time_ms: int
    seed_used: int | None
    status: str
    error_message: str | None
    ab_pair_id: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class GenerationListResponse(BaseModel):
    generations: list[GenerationResponse]
    total: int
