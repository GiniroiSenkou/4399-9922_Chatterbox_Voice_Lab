from __future__ import annotations

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IDMixin, TimestampMixin


class Project(Base, IDMixin, TimestampMixin):
    __tablename__ = "projects"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    settings: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON

    clips: Mapped[list] = relationship("TimelineClip", back_populates="project", cascade="all, delete-orphan")
