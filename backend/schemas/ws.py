from __future__ import annotations

from pydantic import BaseModel


class WSMessage(BaseModel):
    type: str
    payload: dict = {}


class WSGenerationProgress(BaseModel):
    job_id: str
    progress: float
    stage: str  # loading_model, generating, saving


class WSGenerationComplete(BaseModel):
    job_id: str
    generation_id: str
    output_url: str
    duration_ms: int
    processing_time_ms: int


class WSGenerationFailed(BaseModel):
    job_id: str
    error: str


class WSEngineStatus(BaseModel):
    models_loaded: list[str]
    device: str
