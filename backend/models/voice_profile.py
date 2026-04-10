from __future__ import annotations

from sqlalchemy import String, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, IDMixin, TimestampMixin


class VoiceProfile(Base, IDMixin, TimestampMixin):
    __tablename__ = "voice_profiles"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array
    original_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    file_format: Mapped[str] = mapped_column(String(10), default="wav")
    sample_rate: Mapped[int] = mapped_column(Integer, default=16000)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0)
    waveform_peaks: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array
    language: Mapped[str | None] = mapped_column(String(10), nullable=True)
