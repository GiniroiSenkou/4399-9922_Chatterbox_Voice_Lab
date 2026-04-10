from __future__ import annotations

from fastapi import HTTPException


class VoiceNotFoundError(HTTPException):
    def __init__(self, voice_id: str) -> None:
        super().__init__(status_code=404, detail=f"Voice profile '{voice_id}' not found")


class GenerationNotFoundError(HTTPException):
    def __init__(self, gen_id: str) -> None:
        super().__init__(status_code=404, detail=f"Generation '{gen_id}' not found")


class InvalidAudioError(HTTPException):
    def __init__(self, reason: str) -> None:
        super().__init__(status_code=422, detail=f"Invalid audio: {reason}")


class ModelLoadError(HTTPException):
    def __init__(self, model: str, reason: str) -> None:
        super().__init__(status_code=503, detail=f"Failed to load model '{model}': {reason}")


class GenerationError(HTTPException):
    def __init__(self, reason: str) -> None:
        super().__init__(status_code=500, detail=f"Generation failed: {reason}")


class ProjectNotFoundError(HTTPException):
    def __init__(self, project_id: str) -> None:
        super().__init__(status_code=404, detail=f"Project '{project_id}' not found")


class PresetNotFoundError(HTTPException):
    def __init__(self, preset_id: str) -> None:
        super().__init__(status_code=404, detail=f"Preset '{preset_id}' not found")
