from __future__ import annotations

from datetime import datetime

from sqlalchemy import String, Float, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, IDMixin, TimestampMixin


class Job(Base, IDMixin, TimestampMixin):
    __tablename__ = "jobs"

    type: Mapped[str] = mapped_column(String(20), nullable=False)  # generation, batch, export, process
    status: Mapped[str] = mapped_column(String(20), default="queued")
    payload: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON
    result: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON
    progress: Mapped[float] = mapped_column(Float, default=0.0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
