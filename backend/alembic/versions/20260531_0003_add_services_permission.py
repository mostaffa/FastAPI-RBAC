"""add services read permission

Revision ID: 20260531_0003
Revises: 20260211_0002
Create Date: 2026-05-31 00:00:03.000000
"""
from __future__ import annotations

from alembic import op
from sqlalchemy import delete
from sqlmodel import Session, select

from app.models.permission import Permission, RolePermission
from app.models.user import Role

# revision identifiers, used by Alembic.
revision = "20260531_0003"
down_revision = "20260211_0002"
branch_labels = None
depends_on = None

PERMISSION_NAME = "services:read"
SUPERUSER_ROLE_NAME = "superuser"


def upgrade() -> None:
    bind = op.get_bind()
    with Session(bind=bind) as db:
        permission = db.exec(
            select(Permission).where(Permission.name == PERMISSION_NAME)
        ).first()
        if not permission:
            permission = Permission(name=PERMISSION_NAME)
            db.add(permission)
            db.commit()
            db.refresh(permission)

        role = db.exec(select(Role).where(Role.name == SUPERUSER_ROLE_NAME)).first()
        if role and permission.id is not None:
            link_exists = db.exec(
                select(RolePermission).where(
                    (RolePermission.role_id == role.id)
                    & (RolePermission.permission_id == permission.id)
                )
            ).first()
            if not link_exists:
                db.add(
                    RolePermission(
                        role_id=role.id,
                        permission_id=permission.id,
                    )
                )
                db.commit()


def downgrade() -> None:
    bind = op.get_bind()
    with Session(bind=bind) as db:
        permission = db.exec(
            select(Permission).where(Permission.name == PERMISSION_NAME)
        ).first()
        if not permission:
            return

        db.exec(delete(RolePermission).where(RolePermission.permission_id == permission.id))
        db.exec(delete(Permission).where(Permission.id == permission.id))
        db.commit()
