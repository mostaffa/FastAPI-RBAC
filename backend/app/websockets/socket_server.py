from collections.abc import Awaitable, Callable
from typing import Any, cast

import socketio  # pyright: ignore[reportMissingTypeStubs]


sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
)
socket_app = socketio.ASGIApp(sio, socketio_path="/ws")

sio_any: Any = sio
socket_event = sio_any.event
_socket_disconnect_fn = cast(Callable[[str], Awaitable[None]], sio_any.disconnect)
_socket_save_session_fn = cast(
    Callable[[str, dict[str, Any]], Awaitable[None]],
    sio_any.save_session,
)
_socket_enter_room_fn = cast(
    Callable[[str, str], Awaitable[None]],
    sio_any.enter_room,
)


async def emit(event: str, data: Any, room: str | list[str] | None = None) -> None:
    await cast(Any, sio).emit(event, data, room=room)


async def socket_disconnect(sid: str) -> None:
    print("##########################################################")
    await _socket_disconnect_fn(sid)


async def socket_save_session(sid: str, session: dict[str, Any]) -> None:
    await _socket_save_session_fn(sid, session)


async def socket_enter_room(sid: str, room: str) -> None:
    await _socket_enter_room_fn(sid, room)
