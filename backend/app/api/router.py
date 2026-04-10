from __future__ import annotations

from fastapi import APIRouter

from app.api import voices, generate, presets, projects, jobs, audio

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(voices.router)
api_router.include_router(generate.router)
api_router.include_router(presets.router)
api_router.include_router(projects.router)
api_router.include_router(jobs.router)
api_router.include_router(audio.router)
