from __future__ import annotations

import json

from fastapi import APIRouter, Depends

from app.dependencies import get_project_service
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse,
    TimelineClipCreate, TimelineClipUpdate, TimelineClipResponse,
)
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["projects"])


def _clip_to_response(c) -> TimelineClipResponse:
    return TimelineClipResponse(
        id=c.id,
        project_id=c.project_id,
        voice_id=c.voice_id,
        generation_id=c.generation_id,
        text=c.text,
        model=c.model,
        params=json.loads(c.params) if c.params else None,
        order_index=c.order_index,
        track=c.track,
        start_ms=c.start_ms,
        speaker_label=c.speaker_label,
        created_at=c.created_at,
    )


def _project_to_response(p) -> ProjectResponse:
    return ProjectResponse(
        id=p.id,
        name=p.name,
        description=p.description,
        settings=json.loads(p.settings) if p.settings else None,
        clips=[_clip_to_response(c) for c in sorted(p.clips, key=lambda x: x.order_index)],
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    offset: int = 0,
    limit: int = 50,
    svc: ProjectService = Depends(get_project_service),
):
    projects, total = await svc.list_projects(offset=offset, limit=limit)
    return ProjectListResponse(
        projects=[_project_to_response(p) for p in projects],
        total=total,
    )


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(
    data: ProjectCreate,
    svc: ProjectService = Depends(get_project_service),
):
    project = await svc.create_project(data)
    return _project_to_response(project)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    svc: ProjectService = Depends(get_project_service),
):
    project = await svc.get_project(project_id)
    return _project_to_response(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    data: ProjectUpdate,
    svc: ProjectService = Depends(get_project_service),
):
    project = await svc.update_project(project_id, data)
    return _project_to_response(project)


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: str,
    svc: ProjectService = Depends(get_project_service),
):
    await svc.delete_project(project_id)


@router.post("/{project_id}/clips", response_model=TimelineClipResponse, status_code=201)
async def add_clip(
    project_id: str,
    data: TimelineClipCreate,
    svc: ProjectService = Depends(get_project_service),
):
    clip = await svc.add_clip(project_id, data)
    return _clip_to_response(clip)


@router.patch("/clips/{clip_id}", response_model=TimelineClipResponse)
async def update_clip(
    clip_id: str,
    data: TimelineClipUpdate,
    svc: ProjectService = Depends(get_project_service),
):
    clip = await svc.update_clip(clip_id, data)
    return _clip_to_response(clip)


@router.delete("/clips/{clip_id}", status_code=204)
async def delete_clip(
    clip_id: str,
    svc: ProjectService = Depends(get_project_service),
):
    await svc.delete_clip(clip_id)


@router.post("/{project_id}/reorder")
async def reorder_clips(
    project_id: str,
    clip_ids: list[str],
    svc: ProjectService = Depends(get_project_service),
):
    await svc.reorder_clips(project_id, clip_ids)
    return {"status": "ok"}
