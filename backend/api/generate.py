from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse

from app.dependencies import get_generation_service
from app.schemas.generation import (
    GenerateRequest, GenerateResponse,
    GenerateABRequest, GenerateABResponse,
    GenerationResponse, GenerationListResponse,
)
from app.services.generation_service import GenerationService

router = APIRouter(tags=["generation"])


def _gen_to_response(g) -> GenerationResponse:
    return GenerationResponse(
        id=g.id,
        voice_id=g.voice_id,
        text=g.text,
        model=g.model,
        params=json.loads(g.params) if g.params else None,
        output_path=g.output_path,
        duration_ms=g.duration_ms,
        processing_time_ms=g.processing_time_ms,
        seed_used=g.seed_used,
        status=g.status,
        error_message=g.error_message,
        ab_pair_id=g.ab_pair_id,
        created_at=g.created_at,
    )


@router.post("/generate", response_model=GenerateResponse, status_code=202)
async def generate(
    request: GenerateRequest,
    svc: GenerationService = Depends(get_generation_service),
):
    job_id = await svc.generate(request)
    return GenerateResponse(job_id=job_id, status="queued")


@router.post("/generate/ab", response_model=GenerateABResponse, status_code=202)
async def generate_ab(
    request: GenerateABRequest,
    svc: GenerationService = Depends(get_generation_service),
):
    job_id_a, job_id_b, ab_pair_id = await svc.generate_ab(request)
    return GenerateABResponse(
        job_id_a=job_id_a,
        job_id_b=job_id_b,
        model_a=request.model_a,
        model_b=request.model_b,
        ab_pair_id=ab_pair_id,
    )


@router.get("/generate/{job_id}", response_model=GenerationResponse)
async def get_generation(
    job_id: str,
    svc: GenerationService = Depends(get_generation_service),
):
    gen = await svc.get_generation(job_id)
    return _gen_to_response(gen)


@router.get("/generate/{job_id}/audio")
async def get_generation_audio(
    job_id: str,
    svc: GenerationService = Depends(get_generation_service),
):
    gen = await svc.get_generation(job_id)
    if not gen.output_path or gen.status != "completed":
        from fastapi import HTTPException
        raise HTTPException(404, "Audio not ready")
    return FileResponse(gen.output_path, media_type="audio/wav")


@router.get("/generations", response_model=GenerationListResponse)
async def list_generations(
    offset: int = 0,
    limit: int = 50,
    svc: GenerationService = Depends(get_generation_service),
):
    gens, total = await svc.list_generations(offset=offset, limit=limit)
    return GenerationListResponse(
        generations=[_gen_to_response(g) for g in gens],
        total=total,
    )


@router.delete("/generations/{gen_id}", status_code=204)
async def delete_generation(
    gen_id: str,
    svc: GenerationService = Depends(get_generation_service),
):
    await svc.delete_generation(gen_id)


@router.delete("/generations", status_code=204)
async def delete_generation_history(
    svc: GenerationService = Depends(get_generation_service),
):
    await svc.delete_history()
