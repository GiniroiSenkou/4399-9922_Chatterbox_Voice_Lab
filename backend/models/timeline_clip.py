from __future__ import annotations

from sqlalchemy import String, Integer, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IDMixin, TimestampMixin


class TimelineClip(Base, IDMixin, TimestampMixin):
    __tablename__ = "timeline_clips"

    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), nullable=False)
    voice_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("voice_profiles.id"), nullable=True)
    generation_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("generations.id"), nullable=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    model: Mapped[str] = mapped_column(String(20), default="turbo")
    params: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    track: Mapped[int] = mapped_column(Integer, default=0)
    start_ms: Mapped[int] = mapped_column(Integer, default=0)
    speaker_label: Mapped[str | None] = mapped_column(String(50), nullable=True)

    project: Mapped["Project"] = relationship("Project", back_populates="clips")
