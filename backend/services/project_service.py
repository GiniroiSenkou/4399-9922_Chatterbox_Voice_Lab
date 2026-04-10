from __future__ import annotations

import json
from pathlib import Path

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ProjectNotFoundError
from app.core.storage import generate_id
from app.models.project import Project
from app.models.timeline_clip import TimelineClip
from app.schemas.project import ProjectCreate, ProjectUpdate, TimelineClipCreate, TimelineClipUpdate


class ProjectService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_projects(self, offset: int = 0, limit: int = 50) -> tuple[list[Project], int]:
        query = select(Project).options(selectinload(Project.clips)).order_by(Project.updated_at.desc())
        count_q = select(func.count()).select_from(select(Project).subquery())
        total = (await self.db.execute(count_q)).scalar() or 0

        result = await self.db.execute(query.offset(offset).limit(limit))
        return list(result.scalars().unique().all()), total

    async def get_project(self, project_id: str) -> Project:
        result = await self.db.execute(
            select(Project).options(selectinload(Project.clips)).where(Project.id == project_id)
        )
        project = result.scalar_one_or_none()
        if not project:
            raise ProjectNotFoundError(project_id)
        return project

    async def create_project(self, data: ProjectCreate) -> Project:
        project = Project(
            id=generate_id(),
            name=data.name,
            description=data.description,
        )
        self.db.add(project)
        await self.db.flush()
        return project

    async def update_project(self, project_id: str, data: ProjectUpdate) -> Project:
        project = await self.get_project(project_id)
        if data.name is not None:
            project.name = data.name
        if data.description is not None:
            project.description = data.description
        if data.settings is not None:
            project.settings = json.dumps(data.settings)
        await self.db.flush()
        return project

    async def delete_project(self, project_id: str) -> None:
        project = await self.get_project(project_id)
        await self.db.delete(project)
        await self.db.flush()

    async def add_clip(self, project_id: str, data: TimelineClipCreate) -> TimelineClip:
        await self.get_project(project_id)  # Validate exists
        clip = TimelineClip(
            id=generate_id(),
            project_id=project_id,
            voice_id=data.voice_id,
            text=data.text,
            model=data.model,
            params=json.dumps(data.params) if data.params else None,
            order_index=data.order_index,
            track=data.track,
            speaker_label=data.speaker_label,
        )
        self.db.add(clip)
        await self.db.flush()
        return clip

    async def update_clip(self, clip_id: str, data: TimelineClipUpdate) -> TimelineClip:
        result = await self.db.execute(
            select(TimelineClip).where(TimelineClip.id == clip_id)
        )
        clip = result.scalar_one_or_none()
        if not clip:
            raise ProjectNotFoundError(clip_id)

        for field in ["voice_id", "text", "model", "order_index", "track", "speaker_label"]:
            val = getattr(data, field, None)
            if val is not None:
                setattr(clip, field, val)
        if data.params is not None:
            clip.params = json.dumps(data.params)

        await self.db.flush()
        return clip

    async def delete_clip(self, clip_id: str) -> None:
        result = await self.db.execute(
            select(TimelineClip).where(TimelineClip.id == clip_id)
        )
        clip = result.scalar_one_or_none()
        if clip:
            await self.db.delete(clip)
            await self.db.flush()

    async def reorder_clips(self, project_id: str, clip_ids: list[str]) -> None:
        for idx, clip_id in enumerate(clip_ids):
            result = await self.db.execute(
                select(TimelineClip).where(TimelineClip.id == clip_id)
            )
            clip = result.scalar_one_or_none()
            if clip and clip.project_id == project_id:
                clip.order_index = idx
        await self.db.flush()
