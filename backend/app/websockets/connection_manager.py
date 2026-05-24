import os
import signal
from collections import defaultdict
from collections.abc import Awaitable, Callable
from types import CoroutineType
from typing import Any, DefaultDict, cast
import socketio  # pyright: ignore[reportMissingTypeStubs]
from fastapi import WebSocket
from http.cookies import SimpleCookie
from app.db.session import get_session
from app.core.security import get_current_user_from_token, extract_bearer_from_cookie_value
from sqlmodel import  select
from app.models.user import User
from app.models.permission import Permission, RolePermission
from app.services.sensor import sensor_service
from app.services.sys_cmd import TerminalService


terminal_manager = TerminalService()
terminal_sessions: dict[str, TerminalService] = {}
# sensorService = SensorService()

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
    user: User | None = db.exec(
        select(User).where(User.id == user_id)
    ).first()
    if not user:
        print(f"\u001b[31mUser not found for SID: {sid}\u001b[0m")
        await emit(event="error", data={
            "code": 404,
            "message": "User not found"
        }, room=sid)
        return
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

    terminal = terminal_sessions.pop(sid, None)

    if terminal:
        await terminal.stop()

    user_id = _sid_user.pop(sid, None)
    if user_id is None:
        return

    _user_sids[user_id].discard(sid)
    if not _user_sids[user_id]:
        _user_sids.pop(user_id, None)

# @socket_event
# async def get_services(sid: str, message: dict[str, Any]):
#     user_id = _sid_user[sid]
#     db = next(get_session())
#     user = db.exec(
#         select(User).where(User.id == user_id)
#     ).first()
#     service_read_permission = db.exec(
#         select(Permission).join(RolePermission).where(RolePermission.role_id == user.role_id).where(Permission.name == "service:read")
#     ).all()
#     print(service_read_permission)
#     if service_read_permission:
#         async for line in system_manager.stream_command("ping", ["-c", "4", "8.8.8.8"]):
#             await emit(event="notification", data={
#                 "type": "success",
#                 "code": 200,
#                 "message": line
#             })
#     else:
        # await emit(event="notification", data={
        #     "type": "error",
        #     "code": 403,
        #     "message": "You dont have permission to read Sensors"
        # })


@socket_event
async def start_terminal(sid: str, message: None):
    print(f"Start Terminal Request: {message}, SID: {sid}")
    existing_terminal = terminal_sessions.pop(sid, None)
    if existing_terminal:
        await existing_terminal.stop()

    terminal = TerminalService()
    terminal_sessions[sid] = terminal
    print(f"Total Terminals: {len(terminal_sessions)}")

    async def send_to_react(data: str):
        await cast(Any, sio).emit(event="terminal_data", data=data, room=sid)

    await terminal.start_shell(send_to_react)
    await emit(event="terminal_pid", data={"terminal_pid": terminal.pid}, room=sid)

@socket_event
async def stop_terminal(sid: str, message: None):
    print(f"Stop Terminal Request: {message}, SID: {sid}")
    terminal = terminal_sessions.pop(sid, None)
    if not terminal:
        return

    stopped_pid = await terminal.stop()
    print(f"############## Killing Terminal with PID: {stopped_pid}")
    if stopped_pid is not None:
        await emit(event="terminal_stopped", data={ "terminal_pid": stopped_pid }, room=sid)

@socket_event
async def terminal_input(sid: str, message: dict):
    print(f"Terminal Input: {message}, SID: {sid}")
    terminal = terminal_sessions.get(sid)
    if not terminal:
        return

    user_input = message.get("input", "")
    await terminal.write_input(user_input)

@socket_event
async def terminal_resize(sid: str, message: dict):
    print(f"Terminal Resize: {message}, SID: {sid}")
    terminal = terminal_sessions.get(sid)
    if not terminal:
        return

    terminal.resize(message["rows"], message["cols"])

@socket_event
async def realtime(sid: str, message: dict):
    await sensor_service.start_monitoring(sio)

async def broadcast(event: str, data: dict[str, Any]) -> None:
    await emit(event, data)


async def emit(event: str, data: dict[str, Any], room: str | list[str] | None = None) -> None:
    await cast(Any, sio).emit(event, data, room=room)


async def socket_disconnect(sid: str) -> None:
    print("##########################################################")
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

@sio.on("disconnect")
async def handle_disconnect(sid: str):
    # This is CRITICAL on Termux to prevent your phone 
    # from heating up with 100 hidden bash processes
    if terminal_manager.pid:
        try:
            os.kill(terminal_manager.pid, signal.SIGKILL)
            print(f"Terminated Termux shell for {sid}")
        except:
            pass

manager = ConnectionManager()