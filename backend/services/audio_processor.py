from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from app.core.storage import temp_path, ensure_temp_dir

logger = logging.getLogger(__name__)


async def process_voice_upload(input_path: Path, output_path: Path) -> None:
    """Convert any audio format to WAV 16kHz mono with normalization."""
    # Trim only leading silence.
    # Using stop_periods here can cut at the first pause and truncate the whole sample.
    audio_filter = (
        "loudnorm=I=-16:TP=-1.5:LRA=11,"
        "silenceremove=start_periods=1:start_silence=0.1:start_threshold=-50dB"
    )
    cmd = [
        "ffmpeg", "-y", "-i", str(input_path),
        "-ar", "16000",
        "-ac", "1",
        "-af", audio_filter,
        "-sample_fmt", "s16",
        str(output_path),
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise RuntimeError(f"FFmpeg failed: {stderr.decode()}")


async def convert_to_format(input_path: Path, output_format: str) -> Path:
    """Convert audio file to specified format."""
    ensure_temp_dir()
    out = temp_path(f".{output_format}")

    if output_format == "mp3":
        cmd = [
            "ffmpeg", "-y", "-i", str(input_path),
            "-codec:a", "libmp3lame", "-b:a", "320k",
            str(out),
        ]
    elif output_format == "flac":
        cmd = [
            "ffmpeg", "-y", "-i", str(input_path),
            "-codec:a", "flac",
            str(out),
        ]
    else:
        cmd = ["ffmpeg", "-y", "-i", str(input_path), str(out)]

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise RuntimeError(f"FFmpeg conversion failed: {stderr.decode()}")
    return out


async def normalize_audio(input_path: Path, output_path: Path) -> None:
    """Apply EBU R128 loudness normalization."""
    cmd = [
        "ffmpeg", "-y", "-i", str(input_path),
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
        str(output_path),
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    await proc.communicate()


async def trim_silence(input_path: Path, output_path: Path) -> None:
    """Trim leading and trailing silence."""
    cmd = [
        "ffmpeg", "-y", "-i", str(input_path),
        "-af", "silenceremove=start_periods=1:start_silence=0.1:start_threshold=-50dB:stop_periods=1:stop_silence=0.1:stop_threshold=-50dB",
        str(output_path),
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    await proc.communicate()


async def concat_audio_files(file_paths: list[Path], output_path: Path, crossfade_ms: int = 50) -> None:
    """Concatenate multiple audio files with optional crossfade."""
    ensure_temp_dir()
    list_file = temp_path(".txt")

    # Write file list for ffmpeg concat
    with open(list_file, "w") as f:
        for p in file_paths:
            f.write(f"file '{p}'\n")

    if crossfade_ms > 0 and len(file_paths) > 1:
        # Use acrossfade filter for pairs
        inputs = []
        for p in file_paths:
            inputs.extend(["-i", str(p)])

        filter_parts = []
        cf_sec = crossfade_ms / 1000.0
        for i in range(len(file_paths) - 1):
            if i == 0:
                filter_parts.append(f"[0][1]acrossfade=d={cf_sec}:c1=tri:c2=tri[a01]")
            else:
                prev = f"a0{i}" if i < 10 else f"a{i}"
                curr = f"a0{i+1}" if i + 1 < 10 else f"a{i+1}"
                filter_parts.append(f"[{prev}][{i+1}]acrossfade=d={cf_sec}:c1=tri:c2=tri[{curr}]")

        cmd = ["ffmpeg", "-y", *inputs, "-filter_complex", ";".join(filter_parts), str(output_path)]
    else:
        cmd = [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", str(list_file), "-c", "copy", str(output_path),
        ]

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()

    # Clean up
    list_file.unlink(missing_ok=True)

    if proc.returncode != 0:
        raise RuntimeError(f"FFmpeg concat failed: {stderr.decode()}")


async def apply_post_processing(input_path: Path, output_path: Path, operations: list[dict]) -> None:
    """Apply a chain of audio processing operations."""
    filters = []

    for op in operations:
        op_type = op.get("type", "")
        params = op.get("params", {})

        if op_type == "normalize":
            target = params.get("target_lufs", -16)
            filters.append(f"loudnorm=I={target}:TP=-1.5:LRA=11")
        elif op_type == "trim_silence":
            threshold = params.get("threshold_db", -50)
            filters.append(
                f"silenceremove=start_periods=1:start_threshold={threshold}dB"
                f":stop_periods=1:stop_threshold={threshold}dB"
            )
        elif op_type == "fade_in":
            duration = params.get("duration_ms", 100) / 1000.0
            filters.append(f"afade=t=in:d={duration}")
        elif op_type == "fade_out":
            duration = params.get("duration_ms", 100) / 1000.0
            filters.append(f"afade=t=out:d={duration}")
        elif op_type == "eq":
            freq = params.get("frequency", 1000)
            gain = params.get("gain_db", 0)
            width = params.get("width", 1.0)
            filters.append(f"equalizer=f={freq}:width_type=o:width={width}:g={gain}")
        elif op_type == "compress":
            threshold = params.get("threshold_db", -20)
            ratio = params.get("ratio", 4)
            filters.append(f"acompressor=threshold={threshold}dB:ratio={ratio}")

    if not filters:
        # No-op: just copy
        cmd = ["ffmpeg", "-y", "-i", str(input_path), "-c", "copy", str(output_path)]
    else:
        af = ",".join(filters)
        cmd = ["ffmpeg", "-y", "-i", str(input_path), "-af", af, str(output_path)]

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise RuntimeError(f"Post-processing failed: {stderr.decode()}")
