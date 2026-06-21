"""Example API test exercising the full stack: HTTP -> auth -> RBAC -> DB.

It seeds a user (with a role + permission) into the in-memory DB, mints a real
JWT for them and calls ``GET /api/v1/users/{id}``. Copy this pattern for the
other endpoints — change the seed data, the permission and the assertions.
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlmodel import Session

from app.core.security import create_access_token, hash_password
from app.models.permission import Permission
from app.models.user import Role, User


@pytest.fixture
def reader(session: Session) -> User:
    """A persisted user whose role grants the ``user:read`` permission."""
    role = Role(name="reader", permissions=[Permission(name="user:read")])
    user = User(
        username="alice",
        email="alice@example.com",
        hashed_password=hash_password("pw"),
        role=role,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def _auth_headers(user: User) -> dict[str, str]:
    token = create_access_token(str(user.id))
    return {"Authorization": f"Bearer {token}"}


async def test_read_user_returns_200_for_authorized_caller(
    client: AsyncClient, reader: User
) -> None:
    resp = await client.get(
        f"/api/v1/users/{reader.id}", headers=_auth_headers(reader)
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["username"] == "alice"
    assert body["email"] == "alice@example.com"


async def test_read_missing_user_returns_404(
    client: AsyncClient, reader: User
) -> None:
    resp = await client.get(
        "/api/v1/users/999999", headers=_auth_headers(reader)
    )

    assert resp.status_code == 404


async def test_read_user_without_token_is_unauthorized(
    client: AsyncClient,
) -> None:
    resp = await client.get("/api/v1/users/1")

    assert resp.status_code == 401
