from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.config import Settings


def test_accepts_absolute_sqlite_path() -> None:
    settings = Settings(database_url="sqlite+aiosqlite:////app/data/db/voicelab.db")
    assert settings.database_url == "sqlite+aiosqlite:////app/data/db/voicelab.db"


def test_rejects_relative_sqlite_path() -> None:
    with pytest.raises(ValidationError) as exc:
        Settings(database_url="sqlite+aiosqlite:///app/data/db/voicelab.db")

    message = str(exc.value)
    assert "absolute file path" in message
    assert "sqlite+aiosqlite:////app/data/db/voicelab.db" in message
