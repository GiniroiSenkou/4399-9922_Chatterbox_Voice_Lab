from __future__ import annotations

from sqlalchemy import String, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, IDMixin, TimestampMixin


class Preset(Base, IDMixin, TimestampMixin):
    __tablename__ = "presets"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    model: Mapped[str] = mapped_column(String(20), nullable=False)
    params: Mapped[str] = mapped_column(Text, nullable=False)  # JSON
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
