"""initial schema

Revision ID: 20260211_0001
Revises: 
Create Date: 2026-02-11 00:00:00.000000
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260211_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "role",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.UniqueConstraint("name", name="uq_role_name"),
    )
    op.create_index("ix_role_name", "role", ["name"], unique=False)

    op.create_table(
        "permission",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.UniqueConstraint("name", name="uq_permission_name"),
    )
    op.create_index("ix_permission_name", "permission", ["name"], unique=False)

    op.create_table(
        "user",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("username", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("first_name", sa.String(), nullable=True),
        sa.Column("last_name", sa.String(), nullable=True),
        sa.Column(
            "active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["role_id"], ["role.id"], name="fk_user_role"),
        sa.UniqueConstraint("username", name="uq_user_username"),
        sa.UniqueConstraint("email", name="uq_user_email"),
    )
    op.create_index("ix_user_username", "user", ["username"], unique=False)

    op.create_table(
        "rolepermission",
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("permission_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["role_id"], ["role.id"], name="fk_rolepermission_role"),
        sa.ForeignKeyConstraint(
            ["permission_id"],
            ["permission.id"],
            name="fk_rolepermission_permission",
        ),
        sa.PrimaryKeyConstraint("role_id", "permission_id"),
    )


def downgrade() -> None:
    op.drop_table("rolepermission")
    op.drop_index("ix_user_username", table_name="user")
    op.drop_table("user")
    op.drop_index("ix_permission_name", table_name="permission")
    op.drop_table("permission")
    op.drop_index("ix_role_name", table_name="role")
    op.drop_table("role")
