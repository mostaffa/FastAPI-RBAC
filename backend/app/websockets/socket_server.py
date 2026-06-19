"""Socket.IO server configuration and utilities.

This module creates the Socket.IO async server with proper ASGI integration
and provides helper functions for emitting events and managing rooms.
"""

from __future__ import annotations

from typing import Any

import socketio  # type: ignore[import-untyped]

from app.core.config import SOCKETIO_CORS_ORIGINS, SOCKETIO_PATH


# ---------------------------------------------------------------------------
# Socket.IO Async Server — configured for ASGI mode with CORS support
# ---------------------------------------------------------------------------

# Accept "*" (allow all) or a comma-separated list of origins. python-socketio
# needs a list[str] for multiple origins — a single comma-joined string would be
# treated as one literal origin and silently reject every real origin.
_cors_allowed_origins: str | list[str] = (
    "*"
    if SOCKETIO_CORS_ORIGINS.strip() == "*"
    else [o.strip() for o in SOCKETIO_CORS_ORIGINS.split(",") if o.strip()]
)

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=_cors_allowed_origins,
    logger=False,
    engineio_logger=False,
    ping_interval=25,  # seconds between heartbeat pings
    ping_timeout=60,    # seconds before considering client disconnected
    max_http_buffer_size=1e6,  # 1MB message size limit
)

# ASGI application mounted at /ws (matches config)
socket_app = socketio.ASGIApp(sio, socketio_path=SOCKETIO_PATH)


# ---------------------------------------------------------------------------
# Event emission helpers — type-safe wrappers around sio.emit()
# ---------------------------------------------------------------------------

async def emit(event: str, data: Any, room: str | list[str] | None = None) -> None:
    """Emit an event to one or more rooms.

    Args:
        event: Event name (e.g., "temp_realtime").
        data: Payload to send.
        room: Room name(s) to target. None = broadcast to all connected clients.
    """
    await sio.emit(event, data, room=room)


async def emit_to_room(event: str, data: Any, room: str) -> None:
    """Emit an event to a specific room (user or role based)."""
    await sio.emit(event, data, room=room)


async def emit_to_user(user_id: int, event: str, data: Any) -> None:
    """Emit an event to all connections for a specific user."""
    room = f"user_{user_id}"
    await sio.emit(event, data, room=room)


# ---------------------------------------------------------------------------
# Room management helpers
# ---------------------------------------------------------------------------

async def socket_disconnect(sid: str) -> None:
    """Force disconnect a client by SID."""
    await sio.disconnect(sid)


async def socket_save_session(sid: str, session: dict[str, Any]) -> None:
    """Save session data for a connection (used during auth)."""
    await sio.save_session(sid, session)


async def socket_enter_room(sid: str, room: str) -> None:
    """Join a client to a named room."""
    await sio.enter_room(sid, room)


# Keep backward-compatible reference for handlers that import it directly
sio_ref = sio
