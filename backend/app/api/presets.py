from __future__ import annotations

import json

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import PresetNotFoundError
from app.core.storage import generate_id
from app.models.preset import Preset
from app.schemas.preset import PresetCreate, PresetUpdate, PresetResponse, PresetListResponse

router = APIRouter(prefix="/presets", tags=["presets"])

# Default presets seeded on first run
DEFAULT_PRESETS = [
    {
        "name": "Podcast",
        "description": "Natural, conversational tone for podcast narration",
        "model": "turbo",
        "params": {"exaggeration": 0.4, "cfg_weight": 0.5, "temperature": 0.6, "speed": 1.0},
    },
    {
        "name": "Cinematic",
        "description": "Deep, dramatic narration style",
        "model": "turbo",
        "params": {"exaggeration": 0.8, "cfg_weight": 0.6, "temperature": 0.8, "speed": 0.9},
    },
    {
        "name": "Energetic",
        "description": "Upbeat, enthusiastic delivery",
        "model": "turbo",
        "params": {"exaggeration": 1.2, "cfg_weight": 0.4, "temperature": 0.9, "speed": 1.15},
    },
    {
        "name": "Calm",
        "description": "Slow, soothing voice for meditation or ASMR",
        "model": "turbo",
        "params": {"exaggeration": 0.3, "cfg_weight": 0.5, "temperature": 0.5, "speed": 0.85},
    },
]


async def seed_default_presets(db: AsyncSession) -> None:
    result = await db.execute(select(func.count()).select_from(Preset))
    count = result.scalar() or 0
    if count == 0:
        for p in DEFAULT_PRESETS:
            preset = Preset(
                id=generate_id(),
                name=p["name"],
                description=p["description"],
                model=p["model"],
                params=json.dumps(p["params"]),
                is_default=True,
            )
            db.add(preset)
        await db.commit()


def _preset_to_response(p: Preset) -> PresetResponse:
    return PresetResponse(
        id=p.id,
        name=p.name,
        description=p.description,
        model=p.model,
        params=json.loads(p.params),
        is_default=p.is_default,
        created_at=p.created_at,
    )


@router.get("", response_model=PresetListResponse)
async def list_presets(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Preset).order_by(Preset.name))
    presets = list(result.scalars().all())
    return PresetListResponse(
        presets=[_preset_to_response(p) for p in presets],
        total=len(presets),
    )


@router.post("", response_model=PresetResponse, status_code=201)
async def create_preset(data: PresetCreate, db: AsyncSession = Depends(get_db)):
    preset = Preset(
        id=generate_id(),
        name=data.name,
        description=data.description,
        model=data.model,
        params=data.params.model_dump_json(),
    )
    db.add(preset)
    await db.flush()
    return _preset_to_response(preset)


@router.patch("/{preset_id}", response_model=PresetResponse)
async def update_preset(
    preset_id: str, data: PresetUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Preset).where(Preset.id == preset_id))
    preset = result.scalar_one_or_none()
    if not preset:
        raise PresetNotFoundError(preset_id)

    if data.name is not None:
        preset.name = data.name
    if data.description is not None:
        preset.description = data.description
    if data.model is not None:
        preset.model = data.model
    if data.params is not None:
        preset.params = data.params.model_dump_json()

    await db.flush()
    return _preset_to_response(preset)


@router.delete("/{preset_id}", status_code=204)
async def delete_preset(preset_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Preset).where(Preset.id == preset_id))
    preset = result.scalar_one_or_none()
    if not preset:
        raise PresetNotFoundError(preset_id)
    await db.delete(preset)
    await db.flush()
