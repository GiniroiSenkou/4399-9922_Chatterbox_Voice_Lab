from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class EventBus:
    """In-process pub/sub for WebSocket broadcasting."""

    def __init__(self) -> None:
        self._subscribers: list[WebSocket] = []
        self._lock = asyncio.Lock()

    async def subscribe(self, ws: WebSocket) -> None:
        async with self._lock:
            self._subscribers.append(ws)

    async def unsubscribe(self, ws: WebSocket) -> None:
        async with self._lock:
            self._subscribers = [s for s in self._subscribers if s is not ws]

    async def publish(self, event_type: str, payload: dict[str, Any]) -> None:
        message = json.dumps({
            "type": event_type,
            "payload": payload,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        async with self._lock:
            dead: list[WebSocket] = []
            for ws in self._subscribers:
                try:
                    await ws.send_text(message)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self._subscribers = [s for s in self._subscribers if s is not ws]


event_bus = EventBus()
