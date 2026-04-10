from __future__ import annotations

from sqlalchemy import String, Integer, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, IDMixin, TimestampMixin


class Generation(Base, IDMixin, TimestampMixin):
    __tablename__ = "generations"

    voice_id: Mapped[str] = mapped_column(String(36), ForeignKey("voice_profiles.id"), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    model: Mapped[str] = mapped_column(String(20), nullable=False)  # turbo, standard, multilingual
    params: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON
    output_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0)
    processing_time_ms: Mapped[int] = mapped_column(Integer, default=0)
    seed_used: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="queued")  # queued, processing, completed, failed
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    ab_pair_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
