from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import FileResponse

from app.config import settings
from app.core.storage import output_path, temp_path, ensure_temp_dir
from app.services.audio_processor import (
    apply_post_processing,
    concat_audio_files,
    convert_to_format,
)

router = APIRouter(prefix="/audio", tags=["audio"])


@router.get("/{filename}")
async def serve_audio(filename: str):
    """Serve a generated audio file."""
    # Check in outputs
    fp = settings.outputs_dir / filename
    if not fp.exists():
        # Check by ID (without extension)
        fp = output_path(filename.rsplit(".", 1)[0]) if "." in filename else output_path(filename)
    if not fp.exists():
        from fastapi import HTTPException
        raise HTTPException(404, "Audio file not found")

    media_type = "audio/wav"
    if fp.suffix == ".mp3":
        media_type = "audio/mpeg"
    elif fp.suffix == ".flac":
        media_type = "audio/flac"

    return FileResponse(str(fp), media_type=media_type)


@router.post("/process")
async def process_audio(
    input_id: str,
    operations: list[dict],
    output_format: str = "wav",
):
    """Apply post-processing pipeline to an audio file."""
    in_path = output_path(input_id)
    if not in_path.exists():
        from fastapi import HTTPException
        raise HTTPException(404, "Input audio not found")

    ensure_temp_dir()
    out = temp_path(f".{output_format}")

    await apply_post_processing(in_path, out, operations)

    if output_format != "wav":
        out = await convert_to_format(out, output_format)

    return FileResponse(str(out), media_type=f"audio/{output_format}")


@router.post("/concat")
async def concat_audio(
    file_ids: list[str],
    crossfade_ms: int = 50,
    output_format: str = "wav",
):
    """Concatenate multiple audio files."""
    paths = []
    for fid in file_ids:
        p = output_path(fid)
        if not p.exists():
            from fastapi import HTTPException
            raise HTTPException(404, f"Audio file {fid} not found")
        paths.append(p)

    ensure_temp_dir()
    out = temp_path(f".{output_format}")

    await concat_audio_files(paths, out, crossfade_ms)

    return FileResponse(str(out), media_type=f"audio/{output_format}")


@router.post("/convert/{gen_id}")
async def convert_audio(gen_id: str, format: str = "mp3"):
    """Convert a generated audio to different format."""
    in_path = output_path(gen_id)
    if not in_path.exists():
        from fastapi import HTTPException
        raise HTTPException(404, "Audio file not found")

    out = await convert_to_format(in_path, format)

    media_type = {"mp3": "audio/mpeg", "flac": "audio/flac", "wav": "audio/wav"}.get(format, "audio/wav")
    return FileResponse(str(out), media_type=media_type, filename=f"{gen_id}.{format}")
