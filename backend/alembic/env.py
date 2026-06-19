"""Alembic environment configuration with connection pooling and autogenerate support.

This module configures Alembic for both offline (script-only) and online
(actual database) migrations with proper connection pooling.
"""

from __future__ import annotations

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool
from sqlmodel import SQLModel

# Import all models so they register on SQLModel.metadata for autogenerate
import app.models  # noqa: F401

# ---------------------------------------------------------------------------
# Alembic Config object — access to alembic.ini values
# ---------------------------------------------------------------------------

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ---------------------------------------------------------------------------
# Database URL — single source of truth. Importing it from app.core.config
# (which loads the root .env and resolves POSTGRES_* / DATABASE_URL) guarantees
# migrations and the running app can never diverge on host/credentials.
# ---------------------------------------------------------------------------

from app.core.config import DATABASE_URL  # noqa: E402

config.set_main_option("sqlalchemy.url", DATABASE_URL)

# ---------------------------------------------------------------------------
# Target metadata for autogenerate — uses SQLModel's combined metadata
# ---------------------------------------------------------------------------

target_metadata = SQLModel.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL (not an engine) and
    generates migration scripts without connecting to the database.
    Ideal for generating migration files in CI/CD or development.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode with connection pooling.

    Uses QueuePool for efficient connection management during migrations,
    which is important when running multiple migrations or in production.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.QueuePool,  # Use pooled connections instead of NullPool
        pool_size=5,
        max_overflow=10,
        pool_timeout=30,
        pool_recycle=1800,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


# ---------------------------------------------------------------------------
# Entry point — choose offline or online mode based on CLI flag
# ---------------------------------------------------------------------------

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()


