"""Permission lookups and Socket.IO room targeting — single source of truth.

Replaces the per-endpoint copies of the permission-join query and the
duplicated ``_check_permission_sync`` helpers that previously lived in the
auth / sensor / services WebSocket handlers.
"""

from __future__ import annotations

from sqlmodel import Session, select

from app.db.session import get_session
from app.models.permission import Permission, RolePermission
from app.models.user import User


def permission_names_from_user(user: User | None) -> list[str]:
    """Permission names for *user*, read from the already-loaded role graph.

    Fires no query when ``user.role`` / ``role.permissions`` were eager-loaded
    (see the ``selectinload`` in ``security._get_user_from_token``).
    """
    if user is None or user.role is None:
        return []
    return [perm.name for perm in user.role.permissions]


def user_has_permission(db: Session, user_id: int, permission_name: str) -> bool:
    """Single-query existence check: does *user_id* hold *permission_name*?"""
    found = db.exec(
        select(Permission.id)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .join(User, User.role_id == RolePermission.role_id)
        .where(User.id == user_id)
        .where(Permission.name == permission_name)
    ).first()
    return found is not None


def check_permission_sync(user_id: int, permission_name: str) -> bool:
    """Self-contained sync permission check for WebSocket executor calls.

    Opens (and deterministically closes) its own session so it can run inside
    ``loop.run_in_executor`` without sharing a request-scoped session.
    """
    db_gen = get_session()
    try:
        return user_has_permission(next(db_gen), user_id, permission_name)
    finally:
        db_gen.close()


def build_rooms_for_permission(db: Session, permission_name: str) -> list[str]:
    """Socket.IO rooms (``role_<id>``) for every role holding *permission_name*.

    One JOIN replaces the previous two-query ``build_user_read_rooms`` /
    ``build_role_rooms`` helpers.
    """
    role_ids = db.exec(
        select(RolePermission.role_id)
        .join(Permission, Permission.id == RolePermission.permission_id)
        .where(Permission.name == permission_name)
    ).all()
    return [f"role_{role_id}" for role_id in role_ids]
