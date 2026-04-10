from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import FileResponse

from app.dependencies import get_voice_service
from app.schemas.voice import VoiceCreate, VoiceUpdate, VoiceResponse, VoiceListResponse
from app.services.voice_service import VoiceService

router = APIRouter(prefix="/voices", tags=["voices"])


def _voice_to_response(v) -> VoiceResponse:
    return VoiceResponse(
        id=v.id,
        name=v.name,
        description=v.description,
        tags=json.loads(v.tags) if v.tags else None,
        original_filename=v.original_filename,
        file_format=v.file_format,
        sample_rate=v.sample_rate,
        duration_ms=v.duration_ms,
        language=v.language,
        created_at=v.created_at,
        updated_at=v.updated_at,
    )


@router.get("", response_model=VoiceListResponse)
async def list_voices(
    search: str | None = None,
    offset: int = 0,
    limit: int = 50,
    svc: VoiceService = Depends(get_voice_service),
):
    voices, total = await svc.list_voices(search=search, offset=offset, limit=limit)
    return VoiceListResponse(
        voices=[_voice_to_response(v) for v in voices],
        total=total,
    )


@router.post("", response_model=VoiceResponse, status_code=201)
async def upload_voice(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(None),
    tags: str = Form(None),  # JSON array string
    language: str = Form(None),
    svc: VoiceService = Depends(get_voice_service),
):
    data = VoiceCreate(
        name=name,
        description=description,
        tags=json.loads(tags) if tags else None,
        language=language,
    )
    voice = await svc.upload_voice(file, data)
    return _voice_to_response(voice)


@router.get("/{voice_id}", response_model=VoiceResponse)
async def get_voice(voice_id: str, svc: VoiceService = Depends(get_voice_service)):
    voice = await svc.get_voice(voice_id)
    return _voice_to_response(voice)


@router.patch("/{voice_id}", response_model=VoiceResponse)
async def update_voice(
    voice_id: str,
    data: VoiceUpdate,
    svc: VoiceService = Depends(get_voice_service),
):
    voice = await svc.update_voice(voice_id, data)
    return _voice_to_response(voice)


@router.delete("/{voice_id}", status_code=204)
async def delete_voice(voice_id: str, svc: VoiceService = Depends(get_voice_service)):
    await svc.delete_voice(voice_id)


@router.get("/{voice_id}/audio")
async def get_voice_audio(voice_id: str, svc: VoiceService = Depends(get_voice_service)):
    voice = await svc.get_voice(voice_id)
    return FileResponse(voice.file_path, media_type="audio/wav", filename=f"{voice.name}.wav")


@router.get("/{voice_id}/waveform")
async def get_voice_waveform(voice_id: str, svc: VoiceService = Depends(get_voice_service)):
    peaks = await svc.get_waveform(voice_id)
    return {"peaks": peaks}
