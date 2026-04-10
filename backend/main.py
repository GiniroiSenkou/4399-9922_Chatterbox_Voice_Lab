from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core.database import init_db, async_session
from app.api.router import api_router
from app.api.ws import router as ws_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


async def _preload_model(engine, model_name: str) -> None:
    try:
        logger.info(f"Background: preloading model '{model_name}'...")
        await engine.preload(model_name)
        logger.info(f"Background: model '{model_name}' ready")
    except Exception as e:
        logger.warning(f"Background: failed to preload model '{model_name}': {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Chatterbox Voice Lab Pro...")
    settings.ensure_dirs()

    # Initialize database
    await init_db()

    # Seed default presets
    from app.api.presets import seed_default_presets
    async with async_session() as db:
        await seed_default_presets(db)

    # Initialize engine manager
    from app.services.engine_manager import EngineManager
    from app.dependencies import set_engine_manager

    engine = EngineManager()
    set_engine_manager(engine)

    # Start job queue
    from app.services.job_queue import job_queue
    await job_queue.start()

    # Pre-load default model in background — don't block startup.
    # Model loading can take 30-300s on first run (downloading weights).
    # The app starts serving immediately; the model is ready when it's ready.
    import asyncio
    if settings.default_model:
        asyncio.create_task(_preload_model(engine, settings.default_model))

    logger.info("Chatterbox Voice Lab Pro ready — model loading in background")

    yield

    # Shutdown
    await job_queue.stop()
    logger.info("Shutdown complete")


app = FastAPI(
    title="Chatterbox Voice Lab Pro",
    version="1.0.0",
    description="Professional Voice Cloning & Synthesis Studio",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(api_router)
app.include_router(ws_router)


@app.get("/health")
async def health():
    from app.dependencies import get_engine_manager
    try:
        em = get_engine_manager()
        status = await em.get_status()
    except RuntimeError:
        status = {"models_loaded": [], "device": "unknown"}

    return {
        "status": "healthy",
        "version": "1.0.0",
        "engine": status,
    }
