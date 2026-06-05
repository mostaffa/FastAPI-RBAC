from typing import Any

from fastapi import WebSocket
from app.websockets import state
from app.websockets.auth import register_connection_handlers
from app.websockets.sensor_handlers import cleanup_sensor_subscriptions, register_sensor_handlers
from app.websockets.services_handlers import (
    cleanup_services_subscriptions,
    register_services_handlers,
)
from app.websockets.socket_server import emit, socket_app, socket_disconnect, socket_event
from app.websockets.terminal_handlers import register_terminal_handlers


register_connection_handlers(socket_event)
register_terminal_handlers(socket_event)
register_sensor_handlers(socket_event)
register_services_handlers(socket_event)


@socket_event
async def disconnect(sid: str):
    terminal = state.terminal_sessions.pop(sid, None)
    if terminal:
        await terminal.stop()

    await cleanup_sensor_subscriptions(sid)
    await cleanup_services_subscriptions(sid)

    user_id = state.sid_user.pop(sid, None)
    if user_id is None:
        return

    state.user_sids[user_id].discard(sid)
    if not state.user_sids[user_id]:
        state.user_sids.pop(user_id, None)


async def broadcast(event: str, data: Any) -> None:
    await emit(event, data)


async def disconnect_user(user_id: int) -> None:
    sids = list(state.user_sids.get(user_id, []))
    for sid in sids:
        await socket_disconnect(sid)


class ConnectionManager:
    """Simple manager for FastAPI WebSocket connections."""
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
    
    async def disconnect(self, websocket: WebSocket):
        pass

manager = ConnectionManager()