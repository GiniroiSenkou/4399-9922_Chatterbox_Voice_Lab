from __future__ import annotations

from collections.abc import AsyncGenerator

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.engine_manager import EngineManager
from app.services.generation_service import GenerationService
from app.services.project_service import ProjectService
from app.services.voice_service import VoiceService

# Singleton engine manager (created in lifespan)
_engine_manager: EngineManager | None = None


def set_engine_manager(em: EngineManager) -> None:
    global _engine_manager
    _engine_manager = em


def get_engine_manager() -> EngineManager:
    if _engine_manager is None:
        raise RuntimeError("EngineManager not initialized")
    return _engine_manager


def get_voice_service(db: AsyncSession = Depends(get_db)) -> VoiceService:
    return VoiceService(db)


def get_generation_service(
    db: AsyncSession = Depends(get_db),
    engine: EngineManager = Depends(get_engine_manager),
) -> GenerationService:
    return GenerationService(db, engine)


def get_project_service(db: AsyncSession = Depends(get_db)) -> ProjectService:
    return ProjectService(db)
