from contextlib import contextmanager
from http.cookies import SimpleCookie
from typing import Any, Iterator

from sqlmodel import select

from app.core.security import extract_bearer_from_cookie_value, get_current_user_from_token
from app.db.session import get_session
from app.models.permission import Permission, RolePermission
from app.models.user import User
from app.websockets import state
from app.websockets.socket_server import socket_disconnect, socket_enter_room, socket_save_session


@contextmanager
def db_session_scope() -> Iterator[Any]:
    db_gen = get_session()
    db = next(db_gen)
    try:
        yield db
    finally:
        db_gen.close()


def has_permission(user_id: int, permission_name: str) -> bool:
    with db_session_scope() as db:
        user = db.exec(select(User).where(User.id == user_id)).first()
        if not user:
            return False
        perm = db.exec(
            select(Permission)
            .join(RolePermission)
            .where(RolePermission.role_id == user.role_id)
            .where(Permission.name == permission_name)
        ).first()
        return perm is not None


def register_connection_handlers(socket_event: Any) -> None:
    @socket_event
    async def connect(sid: str, environ: dict[str, Any]):
        print(f"\u001b[32mSocket Connection attempt: {sid}\u001b[0m")
        token_cookie = None
        headers = environ.get("asgi.scope", {}).get("headers", [])
        for k, v in headers:
            if k == b"cookie":
                c = SimpleCookie()
                try:
                    c.load(v.decode("utf-8"))
                except Exception:
                    break
                if "access_token" in c:
                    token_cookie = c["access_token"].value
                break

        if not token_cookie:
            print(f"\u001b[31mConnection rejected (no token cookie): {sid}\u001b[0m")
            await socket_disconnect(sid)
            return False

        with db_session_scope() as db:
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
        await socket_save_session(sid, {"user_id": user_id})
        await socket_enter_room(sid, f"user_{user_id}")
        await socket_enter_room(sid, f"role_{user_info.role_id}")
        state.user_sids[user_id].add(sid)
        state.sid_user[sid] = user_id
        print(f"\u001b[32mSocket Connected: {sid} (User ID: {user_id})\u001b[0m")
        return True
