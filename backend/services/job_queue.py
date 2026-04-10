from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, Callable, Coroutine

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.events import event_bus
from app.core.storage import generate_id
from app.models.job import Job

logger = logging.getLogger(__name__)


class JobQueue:
    """In-process async job queue for V1. Can be replaced with Redis/Celery for V2."""

    def __init__(self) -> None:
        self._queue: asyncio.Queue[tuple[str, Callable[..., Coroutine]]] = asyncio.Queue()
        self._running = False

    async def start(self) -> None:
        self._running = True
        asyncio.create_task(self._worker())

    async def stop(self) -> None:
        self._running = False

    async def submit(
        self,
        db: AsyncSession,
        job_type: str,
        payload: dict,
        handler: Callable[..., Coroutine],
    ) -> str:
        job_id = generate_id()
        job = Job(
            id=job_id,
            type=job_type,
            status="queued",
            payload=json.dumps(payload),
        )
        db.add(job)
        await db.flush()

        await self._queue.put((job_id, handler))
        await event_bus.publish("job:queued", {"job_id": job_id, "type": job_type})

        return job_id

    async def _worker(self) -> None:
        while self._running:
            try:
                job_id, handler = await asyncio.wait_for(self._queue.get(), timeout=1.0)
            except asyncio.TimeoutError:
                continue

            try:
                await self._update_job_status(job_id, "processing")
                await handler(job_id)
                await self._update_job_status(job_id, "completed")
                await event_bus.publish("job:complete", {"job_id": job_id})
            except Exception as e:
                logger.exception(f"Job {job_id} failed")
                await self._update_job_status(job_id, "failed", error=str(e))
                await event_bus.publish("job:failed", {"job_id": job_id, "error": str(e)})

    async def _update_job_status(
        self, job_id: str, status: str, error: str | None = None
    ) -> None:
        from app.core.database import async_session
        async with async_session() as session:
            result = await session.execute(select(Job).where(Job.id == job_id))
            job = result.scalar_one_or_none()
            if job:
                job.status = status
                if error:
                    job.error_message = error
                if status == "processing":
                    job.started_at = datetime.now(timezone.utc)
                elif status in ("completed", "failed"):
                    job.completed_at = datetime.now(timezone.utc)
                await session.commit()


job_queue = JobQueue()
