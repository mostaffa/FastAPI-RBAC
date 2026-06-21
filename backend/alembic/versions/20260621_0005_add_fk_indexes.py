"""add indexes on user.role_id and rolepermission.permission_id

Revision ID: 20260621_0005
Revises: 20260531_0004
Create Date: 2026-06-21 00:00:05.000000
"""
from __future__ import annotations

from alembic import op

# revision identifiers, used by Alembic.
revision = "20260621_0005"
down_revision = "20260531_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Postgres does not auto-index foreign keys; these back the RBAC join and
    # the room-builder filter on permission_id.
    op.create_index("ix_user_role_id", "user", ["role_id"], unique=False)
    op.create_index(
        "ix_rolepermission_permission_id",
        "rolepermission",
        ["permission_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_rolepermission_permission_id", table_name="rolepermission")
    op.drop_index("ix_user_role_id", table_name="user")
