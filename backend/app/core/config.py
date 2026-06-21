"""Application configuration — single source of truth for settings."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Load .env once at import time from the repo root (one level above backend/).
# config.py lives at backend/app/core/, so the repo root is parents[3].
# This MUST match alembic/env.py, manage_db.py and seed_db.py — they all load
# the repo-root .env; if config.py loaded backend/.env instead, the running app
# and the migrations would use different DB credentials.
# ---------------------------------------------------------------------------
_env_path = Path(__file__).resolve().parents[3] / ".env"
if _env_path.exists():
    load_dotenv(dotenv_path=_env_path)


def _get(key: str, default: str = "") -> str:
    return os.getenv(key, default)


# ---------------------------------------------------------------------------
# General
# ---------------------------------------------------------------------------
APP_NAME: str = _get("APP_NAME", "RPi IoT Gateway")
DEBUG: bool = _get("DEBUG", "false").lower() == "true"

# ---------------------------------------------------------------------------
# Server / ASGI
# ---------------------------------------------------------------------------
HOST: str = _get("HOST", "0.0.0.0")
PORT: int = int(_get("PORT", "8000"))

# ---------------------------------------------------------------------------
# CORS — comma-separated origins (empty string = allow all, not recommended)
# ---------------------------------------------------------------------------
CORS_ORIGINS: list[str] = [
    o.strip() for o in _get("CORS_ORIGINS", "").split(",") if o.strip()
]

# ---------------------------------------------------------------------------
# Database — constructed URL from env vars or DATABASE_URL
# ---------------------------------------------------------------------------
DATABASE_URL: str = _get(
    "DATABASE_URL",
    (
        f"postgresql://{_get('POSTGRES_USER')}"
        f":{_get('POSTGRES_PASSWORD')}@"
        f"{_get('POSTGRES_HOST', 'localhost')}:"
        f"{_get('POSTGRES_PORT', '5432')}"
        f"/{_get('POSTGRES_DB')}"
    )
    if _get("POSTGRES_USER") and _get("POSTGRES_DB")
    else "postgresql://rbac:123456789@localhost/rbac",
)

# Connection pool settings
DB_POOL_SIZE: int = int(_get("DB_POOL_SIZE", "5"))
DB_MAX_OVERFLOW: int = int(_get("DB_MAX_OVERFLOW", "5"))
DB_POOL_TIMEOUT: int = int(_get("DB_POOL_TIMEOUT", "30"))
DB_POOL_RECYCLE: int = int(_get("DB_POOL_RECYCLE", "1800"))  # 30 min
DB_ECHO: bool = _get("DB_ECHO", "false").lower() == "true"

# ---------------------------------------------------------------------------
# Security / JWT
# ---------------------------------------------------------------------------
SECRET_KEY: str = _get("SECRET_KEY", "CHANGE_ME_SUPER_SECRET_KEY")
ALGORITHM: str = _get("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
    _get("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
)

# ---------------------------------------------------------------------------
# Seeding / first-run bootstrap
# ---------------------------------------------------------------------------
# Bump SEED_VERSION to force a full DB reset (drop + re-migrate + reseed) on the
# next backend start. See app/core/bootstrap.py. WARNING: changing this wipes
# all data in the database.
SEED_VERSION: str = _get("SEED_VERSION", "1")

# ---------------------------------------------------------------------------
# Socket.IO
# ---------------------------------------------------------------------------
SOCKETIO_CORS_ORIGINS: str = _get("SOCKETIO_CORS_ORIGINS", "*")
SOCKETIO_PATH: str = _get("SOCKETIO_PATH", "/ws")

# Shared message queue for Socket.IO. REQUIRED when running more than one worker
# (e.g. gunicorn --workers N): each worker keeps its own in-memory room registry,
# so without a shared backend an emit on one worker never reaches clients held by
# another — notifications then arrive only ~1/N of the time. Every worker connects
# to the same Redis and Socket.IO fans emits out over pub/sub. Empty = default
# in-memory manager (only correct for a SINGLE worker). SOCKETIO_MESSAGE_QUEUE may
# point at a different broker (e.g. amqp://) and falls back to REDIS_URL.
REDIS_URL: str = _get("REDIS_URL", "")
SOCKETIO_MESSAGE_QUEUE: str = _get("SOCKETIO_MESSAGE_QUEUE", REDIS_URL)

# ---------------------------------------------------------------------------
# Sensors polling interval (seconds)
# ---------------------------------------------------------------------------
SENSOR_POLL_INTERVAL: float = float(_get("SENSOR_POLL_INTERVAL", "1.0"))

# ---------------------------------------------------------------------------
# Services monitoring interval (seconds)
# ---------------------------------------------------------------------------
SERVICES_POLL_INTERVAL: float = float(_get("SERVICES_POLL_INTERVAL", "5.0"))
