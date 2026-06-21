"""Database session management with proper connection pooling."""

from __future__ import annotations

from typing import Generator

from sqlalchemy.pool import QueuePool
from sqlmodel import Session, create_engine

from app.core.config import (
    DATABASE_URL,
    DB_ECHO,
    DB_MAX_OVERFLOW,
    DB_POOL_RECYCLE,
    DB_POOL_SIZE,
    DB_POOL_TIMEOUT,
)

# ---------------------------------------------------------------------------
# Engine — created once with proper pooling configuration
# ---------------------------------------------------------------------------
engine = create_engine(
    DATABASE_URL,
    echo=DB_ECHO,
    poolclass=QueuePool,
    pool_size=DB_POOL_SIZE,
    max_overflow=DB_MAX_OVERFLOW,
    pool_timeout=DB_POOL_TIMEOUT,
    pool_recycle=DB_POOL_RECYCLE,
)


# ---------------------------------------------------------------------------
# Session generator — used by FastAPI ``Depends`` and, via next()/close(),
# by the WebSocket permission checks.
# ---------------------------------------------------------------------------

def get_session() -> Generator[Session, None, None]:
    """Yield a database session and ensure it's closed after use.

    Kept as a plain generator (no @contextmanager): FastAPI's ``Depends`` and
    the WebSocket handlers both rely on the generator protocol — the latter
    call ``next(get_session())`` / ``db_gen.close()`` directly, which a
    context-manager wrapper would break.
    """
    with Session(engine) as session:
        yield session


# ---------------------------------------------------------------------------
# Lifecycle — dispose the connection pool on shutdown.
# ---------------------------------------------------------------------------

def shutdown_db() -> None:
    """Dispose the connection pool on application shutdown."""
    engine.dispose()
