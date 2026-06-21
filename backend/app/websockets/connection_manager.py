"""WebSocket connection registration and disconnect cleanup.

Registers all Socket.IO event handlers (auth, sensors, services) and the
disconnect cleanup. ``emit`` / ``sio`` / ``socket_app`` are re-exported here
for the REST endpoints and the ASGI mount in ``main``.
"""

from __future__ import annotations

from app.websockets import state
from app.websockets.auth import register_connection_handlers
from app.websockets.sensor_handlers import cleanup_sensor_subscriptions, register_sensor_handlers
from app.websockets.services_handlers import (
    cleanup_services_subscriptions,
    register_services_handlers,
)
from app.websockets.socket_server import emit, sio, socket_app

__all__ = ["emit", "sio", "socket_app"]


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
