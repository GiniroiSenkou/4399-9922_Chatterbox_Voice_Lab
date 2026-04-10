from __future__ import annotations

import json
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings
from sqlalchemy.engine import make_url


class Settings(BaseSettings):
    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Device
    device: str = "cpu"
    default_model: str = "turbo"
    max_loaded_models: int = 1

    # Storage
    storage_root: Path = Path("/app/data")
    database_url: str = "sqlite+aiosqlite:////app/data/db/voicelab.db"
    hf_home: str = "/app/data/models"

    # Upload limits
    max_upload_size_mb: int = 50
    max_voice_duration_s: int = 60
    min_voice_duration_s: int = 5

    # CORS
    cors_origins: str = '["http://localhost:5173","http://localhost:8080"]'

    @field_validator("database_url")
    @classmethod
    def validate_database_url(cls, value: str) -> str:
        if not value.startswith("sqlite"):
            return value

        url = make_url(value)
        db_path = url.database or ""

        # Allow in-memory SQLite for tests/dev scripts.
        if db_path == ":memory:":
            return value

        if not db_path:
            raise ValueError(
                "DATABASE_URL for SQLite must include a database file path. "
                "Example: sqlite+aiosqlite:////app/data/db/voicelab.db"
            )

        if not Path(db_path).is_absolute():
            raise ValueError(
                "DATABASE_URL for SQLite must use an absolute file path "
                "(four slashes after sqlite+aiosqlite:). "
                "Example: sqlite+aiosqlite:////app/data/db/voicelab.db"
            )

        return value

    @property
    def voices_dir(self) -> Path:
        return self.storage_root / "voices"

    @property
    def outputs_dir(self) -> Path:
        return self.storage_root / "outputs"

    @property
    def projects_dir(self) -> Path:
        return self.storage_root / "projects"

    @property
    def db_dir(self) -> Path:
        return self.storage_root / "db"

    @property
    def cors_origins_list(self) -> list[str]:
        return json.loads(self.cors_origins)

    def ensure_dirs(self) -> None:
        for d in [self.voices_dir, self.outputs_dir, self.projects_dir, self.db_dir]:
            d.mkdir(parents=True, exist_ok=True)

    model_config = {"env_prefix": "", "case_sensitive": False}


settings = Settings()
