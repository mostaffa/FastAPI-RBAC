"""Database session management with proper connection pooling."""

from __future__ import annotations

import threading
from typing import Generator

from sqlalchemy.pool import QueuePool
from sqlmodel import Session, SQLModel, create_engine

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
# Synchronous session generator (for FastAPI Depends and manual next() use)
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
# Lifecycle helpers for startup/shutdown
# ---------------------------------------------------------------------------

def init_db() -> None:
    """Initialize database — run migrations, create tables if needed."""
    # This is called on FastAPI startup
    pass


def shutdown_db() -> None:
    """Shutdown database — dispose connection pool."""
    engine.dispose()


# ---------------------------------------------------------------------------
# Convenience: create all tables (for development/testing only)
# ---------------------------------------------------------------------------

def create_tables() -> None:
    """Create all tables defined in models. Development use only."""
    SQLModel.metadata.create_all(engine)


# ---------------------------------------------------------------------------
# Thread-local session for background tasks
# ---------------------------------------------------------------------------

_local = threading.local()


def get_thread_session() -> Session:
    """Get a thread-local session for use in background tasks."""
    if not hasattr(_local, "session"):
        _local.session = Session(engine)
    return _local.session


def close_thread_session() -> None:
    """Close thread-local session if it exists."""
    if hasattr(_local, "session"):
        _local.session.close()

