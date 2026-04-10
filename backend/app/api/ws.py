from __future__ import annotations

import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.events import event_bus
from app.dependencies import get_engine_manager

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    await event_bus.subscribe(ws)

    logger.info("WebSocket client connected")

    try:
        # Send initial engine status
        try:
            em = get_engine_manager()
            status = await em.get_status()
            await ws.send_json({
                "type": "engine:status",
                "payload": status,
            })
        except RuntimeError:
            pass

        while True:
            data = await ws.receive_text()
            try:
                msg = json.loads(data)
                msg_type = msg.get("type", "")

                if msg_type == "ping":
                    await ws.send_json({"type": "pong", "payload": {}})
                elif msg_type == "engine:preload":
                    model = msg.get("payload", {}).get("model")
                    if model:
                        try:
                            em = get_engine_manager()
                            import asyncio
                            asyncio.create_task(em.preload(model))
                        except RuntimeError:
                            pass
                elif msg_type == "generation:cancel":
                    # Cancel is handled via the job system
                    pass

            except json.JSONDecodeError:
                pass

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    finally:
        await event_bus.unsubscribe(ws)
