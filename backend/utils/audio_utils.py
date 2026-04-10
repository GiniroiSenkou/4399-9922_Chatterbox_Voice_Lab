from __future__ import annotations

import asyncio
import json
import struct
import wave
from pathlib import Path


async def get_audio_info(file_path: Path) -> dict:
    """Get audio file info using ffprobe."""
    cmd = [
        "ffprobe", "-v", "quiet",
        "-print_format", "json",
        "-show_format", "-show_streams",
        str(file_path),
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, _ = await proc.communicate()
    data = json.loads(stdout)

    fmt = data.get("format", {})
    stream = next((s for s in data.get("streams", []) if s.get("codec_type") == "audio"), {})

    return {
        "duration_ms": int(float(fmt.get("duration", 0)) * 1000),
        "sample_rate": int(stream.get("sample_rate", 0)),
        "channels": int(stream.get("channels", 0)),
        "format": fmt.get("format_name", "unknown"),
        "file_size_bytes": int(fmt.get("size", 0)),
    }


def compute_waveform_peaks(wav_path: Path, num_peaks: int = 128) -> list[float]:
    """Extract waveform peak values for UI visualization."""
    try:
        with wave.open(str(wav_path), "rb") as wf:
            n_frames = wf.getnframes()
            n_channels = wf.getnchannels()
            sampwidth = wf.getsampwidth()

            if n_frames == 0:
                return [0.0] * num_peaks

            raw = wf.readframes(n_frames)

            if sampwidth == 2:
                fmt = f"<{n_frames * n_channels}h"
                samples = list(struct.unpack(fmt, raw))
            else:
                samples = [0.0] * n_frames

            # Take first channel if stereo
            if n_channels > 1:
                samples = samples[::n_channels]

            # Compute peaks
            chunk_size = max(1, len(samples) // num_peaks)
            peaks = []
            for i in range(num_peaks):
                start = i * chunk_size
                end = min(start + chunk_size, len(samples))
                if start >= len(samples):
                    peaks.append(0.0)
                else:
                    chunk = samples[start:end]
                    peak = max(abs(s) for s in chunk) / 32768.0 if chunk else 0.0
                    peaks.append(round(peak, 4))

            return peaks
    except Exception:
        return [0.0] * num_peaks
