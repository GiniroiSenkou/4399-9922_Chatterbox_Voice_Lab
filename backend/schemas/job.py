from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class JobResponse(BaseModel):
    id: str
    type: str
    status: str
    progress: float
    error_message: str | None
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class JobListResponse(BaseModel):
    jobs: list[JobResponse]
    total: int
