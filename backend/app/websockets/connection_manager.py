"""WebSocket connection manager and Socket.IO registration.

This module registers all Socket.IO event handlers and provides
a simple FastAPI WebSocket manager for non-socket endpoints.

NOTE: The duplicate / websocket endpoint has been removed — Socket.IO
handles its own connection lifecycle via the ASGI app mounted at /ws.
"""

from __future__ import annotations

from typing import Any

from fastapi import WebSocket
from app.websockets import state
from app.websockets.auth import register_connection_handlers
from app.websockets.sensor_handlers import cleanup_sensor_subscriptions, register_sensor_handlers
from app.websockets.services_handlers import (
    cleanup_services_subscriptions,
    register_services_handlers,
)
from app.websockets.socket_server import emit, sio, socket_app


# ---------------------------------------------------------------------------
# Register all event handlers (auth, sensors, services)
# ---------------------------------------------------------------------------

register_connection_handlers(sio.event)
register_sensor_handlers(sio.event)
register_services_handlers(sio.event)


# ---------------------------------------------------------------------------
# Disconnect handler — cleanup subscriptions and user state
# ---------------------------------------------------------------------------

@sio.event
async def disconnect(sid: str) -> None:
    """Handle client disconnection — cleanup all resources."""
    await cleanup_sensor_subscriptions(sid)
    await cleanup_services_subscriptions(sid)

    user_id = state.sid_user.pop(sid, None)
    if user_id is None:
        return

    state.user_sids[user_id].discard(sid)
    if not state.user_sids[user_id]:
        state.user_sids.pop(user_id, None)


# ---------------------------------------------------------------------------
# Broadcast helper — send event to all connected clients
# ---------------------------------------------------------------------------

async def broadcast(event: str, data: Any) -> None:
    """Broadcast an event to all connected Socket.IO clients."""
    await emit(event, data)


# ---------------------------------------------------------------------------
# User disconnection helper — force disconnect all connections for a user
# ---------------------------------------------------------------------------

async def disconnect_user(user_id: int) -> None:
    """Force disconnect all WebSocket connections for a specific user."""
    sids = list(state.user_sids.get(user_id, []))
    for sid in sids:
        await sio.disconnect(sid)


# ---------------------------------------------------------------------------
# FastAPI WebSocket manager (for non-socket endpoints if needed)
# ---------------------------------------------------------------------------

class ConnectionManager:
    """Simple manager for raw FastAPI WebSocket connections.

    Note: Most WebSocket functionality is handled by Socket.IO above.
    This manager exists for any raw WebSocket endpoints that may be added later.
    """

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()

    async def disconnect(self, websocket: WebSocket) -> None:
        pass


manager = ConnectionManager()

