"""Shared pytest fixtures.

Every test runs against a throwaway in-memory SQLite database — the real
Postgres engine is never touched. We override the app's ``get_session``
dependency so endpoints, auth and RBAC all read/write the same test session.

Fixtures
--------
- ``engine``  : a fresh in-memory SQLite engine with every table created.
- ``session`` : a SQLModel ``Session`` bound to that engine.
- ``client``  : an async ``httpx.AsyncClient`` whose ``get_session`` is the
  test session, talking to the app in-process via ASGI (no network).
"""

from __future__ import annotations

from collections.abc import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

# Importing the model modules registers their tables on ``SQLModel.metadata``
# so ``create_all`` below knows about them. Keep these imports even though the
# names are unused.
from app.models import permission as _permission  # noqa: F401
from app.models import user as _user  # noqa: F401
from app.db.session import get_session
from app.main import app


@pytest.fixture(name="engine")
def engine_fixture():
    # A single shared in-memory connection (StaticPool) so the schema and data
    # created on one connection are visible to every session in the test.
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    yield engine
    SQLModel.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture(name="session")
def session_fixture(engine) -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


@pytest_asyncio.fixture(name="client")
async def client_fixture(session: Session) -> AsyncGenerator[AsyncClient, None]:
    def get_session_override() -> Generator[Session, None, None]:
        yield session

    app.dependency_overrides[get_session] = get_session_override
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()
