#!/usr/bin/env python3
"""Database reset, migration, and seeding script.

Usage:
    python alembic/reset_db.py [--no-seed] [--skip-cache]

This script:
1. Drops all tables (including alembic_version)
2. Runs Alembic migrations to recreate the schema
3. Seeds default permissions and superuser
4. Optionally clears FastAPI caches
"""

from __future__ import annotations

import argparse
import importlib
import os
import sys
from pathlib import Path

# Ensure the backend package is importable when running as a script.
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


def ensure_models_imported() -> None:
    """Import all models so Alembic can detect schema changes."""
    import app.models  # noqa: F401


def reset_database() -> None:
    """Drop all tables and Alembic version table to start fresh."""
    from sqlalchemy import text

    ensure_models_imported()
    from app.db.session import engine
    from sqlmodel import SQLModel

    # Drop all application tables
    SQLModel.metadata.drop_all(engine)

    # Also drop the alembic_version table so migrations run fresh
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
        conn.commit()

    print("Database reset complete.")


def seed_database() -> None:
    from app.core.seed_db import (
        seed_default_superuser,
        seed_permissions,
        seed_superuser_role,
    )

    seed_permissions()
    seed_superuser_role()
    seed_default_superuser()


def verify_permissions_seeded() -> int:
    from sqlmodel import Session, select
    from app.models.permission import Permission

    from app.db.session import engine

    with Session(engine) as db:
        return len(db.exec(select(Permission)).all())


def clear_fastapi_caches() -> None:
    """Clear in-memory caches for configured targets.

    Set FASTAPI_CACHE_CLEAR_TARGETS to a comma-separated list of
    module:function paths, e.g. "app.core.settings:get_settings".
    """
    targets = os.getenv("FASTAPI_CACHE_CLEAR_TARGETS", "").strip()
    if not targets:
        print("No FastAPI cache targets configured; skipping cache clear.")
        return

    cleared = 0
    for raw_target in targets.split(","):
        target = raw_target.strip()
        if not target:
            continue
        if ":" not in target:
            print(f"Invalid cache target '{target}'. Use module:function format.")
            continue
        module_name, func_name = target.rsplit(":", 1)
        module = importlib.import_module(module_name)
        func = getattr(module, func_name, None)
        if func is None or not hasattr(func, "cache_clear"):
            print(f"No cache_clear() on {module_name}:{func_name}. Skipping.")
            continue
        func.cache_clear()
        cleared += 1

    print(f"Cleared {cleared} cache(s).")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Reset the database and clear FastAPI caches."
    )
    parser.add_argument(
        "--no-seed",
        action="store_true",
        help="Skip seeding default permissions and superuser.",
    )
    parser.add_argument(
        "--skip-cache",
        action="store_true",
        help="Skip clearing FastAPI caches.",
    )
    return parser.parse_args()


def run_alembic_migrations() -> None:
    """Run Alembic migrations to create the schema."""
    import subprocess

    print("Running Alembic migrations...")
    result = subprocess.run(
        ["python", "-m", "alembic", "upgrade", "head"],
        cwd=BACKEND_ROOT,
        capture_output=False,  # Show output in real-time
        text=True,
    )

    if result.returncode != 0:
        print("Failed to run Alembic migrations!")
        sys.exit(1)

    print("Alembic migrations applied successfully.")


def main() -> None:
    args = parse_args()

    # Load environment variables from project root .env
    env_path = Path(__file__).resolve().parents[2] / ".env"
    if env_path.exists():
        from dotenv import load_dotenv
        load_dotenv(dotenv_path=env_path)

    reset_database()
    run_alembic_migrations()

    if not args.no_seed:
        seed_database()
        permission_count = verify_permissions_seeded()
        print(f"Seeded permissions: {permission_count}")

    if not args.skip_cache:
        clear_fastapi_caches()

    print("Done.")


if __name__ == "__main__":
    main()
