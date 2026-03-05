from collections import defaultdict
from collections.abc import Awaitable, Callable
from typing import Any, DefaultDict, cast
import socketio  # pyright: ignore[reportMissingTypeStubs]
from fastapi import WebSocket
from http.cookies import SimpleCookie
from app.db.session import get_session
from app.core.security import get_current_user_from_token, extract_bearer_from_cookie_value
from sqlmodel import Session, select
from app.models.user import User
from app.models.permission import Permission, RolePermission
from app.services.sensor import sensor_service

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    )
socket_app = socketio.ASGIApp(sio, socketio_path="/ws")
sio_any: Any = sio
socket_event = sio_any.event
socket_disconnect_fn = cast(Callable[[str], Awaitable[None]], sio_any.disconnect)
socket_save_session_fn = cast(
    Callable[[str, dict[str, Any]], Awaitable[None]],
    sio_any.save_session,
)
socket_enter_room_fn = cast(
    Callable[[str, str], Awaitable[None]],
    sio_any.enter_room,
)

_user_sids = cast(DefaultDict[int, set[str]], defaultdict(set))
_sid_user: dict[str, int] = {}

# connect event, if the user is authenticated, add them to a room based on their user ID or role
@socket_event
async def connect(sid: str, environ: dict[str, Any]):
    print(f"\u001b[32mSocket Connection attempt: {sid}\u001b[0m")
    token_cookie = None
    headers = environ.get("asgi.scope", {}).get("headers", [])
    for k, v in headers:
        if k == b'cookie':
            c = SimpleCookie()
            try:
                c.load(v.decode('utf-8'))
            except Exception:
                break
            if 'access_token' in c:
                token_cookie = c['access_token'].value
            break

    # reject connection if no token cookie
    if not token_cookie:
        print(f"\u001b[31mConnection rejected (no token cookie): {sid}\u001b[0m")
        await socket_disconnect(sid)
        return False
    # get user info from token (you would implement this function to decode the JWT and fetch user info from DB)
    db = next(get_session())
    user_info = get_current_user_from_token(
        extract_bearer_from_cookie_value(token_cookie),
        db,
    )
    if not user_info:
        print(f"\u001b[31mConnection rejected (invalid token): {sid}\u001b[0m")
        await socket_disconnect(sid)
        return False
    user_id = user_info.id
    if user_id is None:
        print(f"\u001b[31mConnection rejected (user id missing): {sid}\u001b[0m")
        await socket_disconnect(sid)
        return False
    
    print(user_info)
    # if user is valid, you can join them to a room based on their user ID or role
    await socket_save_session(sid, {"user_id": user_id})
    # join the user to his own room, his role room
    await socket_enter_room(sid, f"user_{user_id}")
    await socket_enter_room(sid, f"role_{user_info.role_id}")
    _user_sids[user_id].add(sid)
    _sid_user[sid] = user_id
    print(f"\u001b[32mSocket Connected: {sid} (User ID: {user_id})\u001b[0m")
    return True

@socket_event
async def sensor_list(sid: str, message: dict[str, Any]):
    print(f"\u001b[32mSensor Message Request Incomming: {sid}\u001b[0m")
    print(message)
    user_id = _sid_user[sid]
    db = next(get_session())
    user = db.exec(
        select(User).where(User.id == user_id)
    ).first()
    print(user)
    sensor_read_perm = db.exec(
        select(Permission).join(RolePermission).where(RolePermission.role_id == user.role_id).where(Permission.name == "sensors:read")
    ).all()
    if sensor_read_perm:
        print("User Has Sensor Read Permission")
        data = await sensor_service.get_sensor_list()
        print(data)
        await emit(event="msg", data={
            "type": "sensors",
            "payload": data
        })
    else:
        print("User Dosent Has Sensor Read Permission")
        await emit(event="error", data={
            "code": 403,
            "message": "You dont have permission to read Sensors"
        })

@socket_event
async def disconnect(sid: str):
    user_id = _sid_user.pop(sid, None)
    if user_id is None:
        return
    _user_sids[user_id].discard(sid)
    if not _user_sids[user_id]:
        _user_sids.pop(user_id, None)


async def broadcast(event: str, data: dict[str, Any]) -> None:
    await emit(event, data)


async def emit(event: str, data: dict[str, Any], room: str | list[str] | None = None) -> None:
    await cast(Any, sio).emit(event, data, room=room)


async def socket_disconnect(sid: str) -> None:
    await socket_disconnect_fn(sid)


async def socket_save_session(sid: str, session: dict[str, Any]) -> None:
    await socket_save_session_fn(sid, session)


async def socket_enter_room(sid: str, room: str) -> None:
    await socket_enter_room_fn(sid, room)


async def disconnect_user(user_id: int) -> None:
    sids = list(_user_sids.get(user_id, []))
    for sid in sids:
        await socket_disconnect(sid)


class ConnectionManager:
    """Simple manager for FastAPI WebSocket connections."""
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
    
    async def disconnect(self, websocket: WebSocket):
        pass


manager = ConnectionManager()