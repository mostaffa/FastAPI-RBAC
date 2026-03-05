"""seed permissions and superuser

Revision ID: 20260211_0002
Revises: 20260211_0001
Create Date: 2026-02-11 00:00:01.000000
"""
from __future__ import annotations

import os

from alembic import op
from sqlalchemy import delete
from sqlmodel import Session, select

from app.core.security import hash_password
from app.models.permission import Permission, RolePermission
from app.models.user import Role, User

# revision identifiers, used by Alembic.
revision = "20260211_0002"
down_revision = "20260211_0001"
branch_labels = None
depends_on = None

PERMISSIONS = [
    "user:create",
    "user:read",
    "user:update",
    "user:delete",
    "role:create",
    "role:read",
    "role:update",
    "role:delete",
    "permission:create",
    "permission:read",
    "permission:update",
    "permission:delete",
    "sensors:read",
]


def _seed_permissions(db: Session) -> None:
    for perm_name in PERMISSIONS:
        exists = db.exec(select(Permission).where(Permission.name == perm_name)).first()
        if not exists:
            db.add(Permission(name=perm_name))
    db.commit()


def _seed_superuser_role(db: Session) -> Role:
    role = db.exec(select(Role).where(Role.name == "superuser")).first()
    if not role:
        role = Role(name="superuser")
        db.add(role)
        db.commit()
        db.refresh(role)

    for perm_name in PERMISSIONS:
        permission = db.exec(select(Permission).where(Permission.name == perm_name)).first()
        if permission:
            link_exists = db.exec(
                select(RolePermission).where(
                    (RolePermission.role_id == role.id)
                    & (RolePermission.permission_id == permission.id)
                )
            ).first()
            if not link_exists:
                db.add(
                    RolePermission(role_id=role.id, permission_id=permission.id)
                )

    db.commit()
    return role


def _seed_default_superuser(db: Session, role: Role) -> None:
    default_username = os.getenv("DEFAULT_USER", "superuser")
    default_password = os.getenv("DEFAULT_PASSWORD", "superuser1234")
    default_email = os.getenv("ADMIN_EMAIL", "admin@example.com")

    existing_user = db.exec(
        select(User).where(User.username == default_username)
    ).first()
    if existing_user:
        return

    admin_user = User(
        username=default_username,
        email=default_email,
        hashed_password=hash_password(default_password),
        role_id=role.id,
    )
    db.add(admin_user)
    db.commit()


def upgrade() -> None:
    bind = op.get_bind()
    with Session(bind=bind) as db:
        _seed_permissions(db)
        role = _seed_superuser_role(db)
        _seed_default_superuser(db, role)


def downgrade() -> None:
    default_username = os.getenv("DEFAULT_USER", "superuser")

    bind = op.get_bind()
    with Session(bind=bind) as db:
        db.exec(delete(User).where(User.username == default_username))

        role = db.exec(select(Role).where(Role.name == "superuser")).first()
        if role:
            db.exec(delete(RolePermission).where(RolePermission.role_id == role.id))
            db.exec(delete(Role).where(Role.id == role.id))

        db.exec(delete(Permission).where(Permission.name.in_(PERMISSIONS)))
        db.commit()
