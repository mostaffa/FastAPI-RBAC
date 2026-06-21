"""Startup database bootstrap.

Run as a module before the API server starts::

    python -m app.core.bootstrap

Responsibilities, all driven by ``SEED_VERSION`` (from the environment / .env):

* **Fresh database**       → run migrations, seed, then record ``SEED_VERSION``.
* **Same ``SEED_VERSION``** → run migrations (idempotent) + seed (idempotent).
* **Changed ``SEED_VERSION``** → DROP everything, migrate from scratch, reseed.

The version marker lives in a tiny ``app_meta`` bookkeeping table that is
deliberately outside the SQLModel metadata, so a reset never erases it.

WARNING: bumping ``SEED_VERSION`` wipes ALL data in the database on next start.
That is the intended "reset on version change" behaviour — use it knowingly.
"""

from __future__ import annotations

import time
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from sqlmodel import SQLModel

import app.models  # noqa: F401  — register tables on SQLModel.metadata
from app.core import config
from app.db.session import engine

# Directory that contains alembic.ini (backend root). bootstrap.py lives at
# backend/app/core/bootstrap.py → parents[2] == backend root.
BACKEND_ROOT = Path(__file__).resolve().parents[2]

META_TABLE = "app_meta"
SEED_VERSION_KEY = "seed_version"


def _log(message: str) -> None:
    print(f"[bootstrap] {message}", flush=True)


def wait_for_db(attempts: int = 30, delay: float = 2.0) -> None:
    """Block until the database accepts connections (or give up)."""
    last_err: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            _log(f"database reachable (attempt {attempt})")
            return
        except OperationalError as exc:
            last_err = exc
            _log(f"database not ready, retrying ({attempt}/{attempts})…")
            time.sleep(delay)
    raise RuntimeError(
        f"database not reachable after {attempts} attempts: {last_err}"
    )


def _ensure_meta_table() -> None:
    with engine.begin() as conn:
        conn.execute(
            text(
                f"CREATE TABLE IF NOT EXISTS {META_TABLE} "
                "(key VARCHAR PRIMARY KEY, value VARCHAR)"
            )
        )


def get_stored_version() -> str | None:
    with engine.connect() as conn:
        row = conn.execute(
            text(f"SELECT value FROM {META_TABLE} WHERE key = :k"),
            {"k": SEED_VERSION_KEY},
        ).first()
    return row[0] if row else None


def set_stored_version(version: str) -> None:
    with engine.begin() as conn:
        conn.execute(
            text(
                f"INSERT INTO {META_TABLE} (key, value) VALUES (:k, :v) "
                "ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value"
            ),
            {"k": SEED_VERSION_KEY, "v": version},
        )


def reset_schema() -> None:
    """Drop all application tables and the alembic version table."""
    _log("dropping all tables for a clean reset")
    SQLModel.metadata.drop_all(engine)
    with engine.begin() as conn:
        conn.execute(text("DROP TABLE IF EXISTS alembic_version"))


def run_migrations() -> None:
    """Upgrade the schema to head using Alembic's in-process API."""
    from alembic import command
    from alembic.config import Config

    _log("running alembic migrations → head")
    cfg = Config(str(BACKEND_ROOT / "alembic.ini"))
    # Resolve script location absolutely so it works regardless of CWD.
    cfg.set_main_option("script_location", str(BACKEND_ROOT / "alembic"))
    command.upgrade(cfg, "head")


def seed() -> None:
    """Seed permissions, the superuser role, and the default admin (idempotent)."""
    from app.core.seed_db import (
        seed_default_superuser,
        seed_permissions,
        seed_superuser_role,
    )

    _log("seeding permissions / role / default superuser (idempotent)")
    seed_permissions()
    seed_superuser_role()
    seed_default_superuser()


def bootstrap() -> None:
    wait_for_db()
    _ensure_meta_table()

    current = str(config.SEED_VERSION)
    stored = get_stored_version()
    _log(f"seed version: stored={stored!r} current={current!r}")

    if stored is not None and stored != current:
        _log(f"SEED_VERSION changed ({stored} → {current}) — full reset")
        reset_schema()

    run_migrations()
    seed()
    set_stored_version(current)
    _log("bootstrap complete")


if __name__ == "__main__":
    bootstrap()
