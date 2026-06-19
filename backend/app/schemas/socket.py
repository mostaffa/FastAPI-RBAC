"""Socket.IO message schemas — type-safe event payloads."""

from __future__ import annotations

from typing import Literal, Union

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Payload types for different event categories
# ---------------------------------------------------------------------------

class IdPayload(BaseModel):
    """Simple ID payload."""
    id: int


class MessagePayload(BaseModel):
    """Generic message payload."""
    message: str


class RolePermissionPayload(BaseModel):
    """Role-permission assignment payload."""
    role_id: int
    permission_id: int


# ---------------------------------------------------------------------------
# Sensor/Service read payloads (imported from other schemas)
# ---------------------------------------------------------------------------

class UserRead(BaseModel):
    id: int
    username: str
    email: str


class RoleRead(BaseModel):
    id: int
    name: str


class PermissionRead(BaseModel):
    id: int
    name: str


# ---------------------------------------------------------------------------
# Main socket message schema
# ---------------------------------------------------------------------------

class SocketMessage(BaseModel):
    """Standard WebSocket event payload.

    Attributes:
        type: Event category (notification, error, CRUD operations)
        payload: Data associated with the event type
    """

    type: Literal[
        "notification",
        "error",
        "user_created",
        "user_updated",
        "user_deleted",
        "role_created",
        "role_updated",
        "role_deleted",
        "role_permission_added",
        "role_permission_removed",
    ]

    payload: Union[
        UserRead,
        RoleRead,
        PermissionRead,
        RolePermissionPayload,
        IdPayload,
        MessagePayload,
        str,
        int,
    ] = Field(..., description="The data associated with the event type")

    model_config = {
        "json_schema_extra": {
            "example": {
                "type": "user_created",
                "payload": {"id": 1, "email": "admin@example.com"},
            }
        }
    }
