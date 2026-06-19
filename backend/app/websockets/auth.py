"""Socket.IO authentication — token extraction, validation, and permission checks.

This module handles WebSocket connection authentication using JWT tokens
from cookie headers, with non-blocking permission checks.
"""

from __future__ import annotations

import asyncio
from http.cookies import SimpleCookie
from typing import Any

from sqlmodel import select

from app.core.security import extract_bearer_from_cookie_value, get_current_user_from_token
from app.db.session import get_session
from app.models.permission import Permission, RolePermission
from app.models.user import User
from app.websockets import state
from app.websockets.socket_server import socket_disconnect, socket_enter_room, socket_save_session


# ---------------------------------------------------------------------------
# Permission check — runs in threadpool to avoid blocking event loop
# ---------------------------------------------------------------------------

def _check_permission_sync(user_id: int, permission_name: str) -> bool:
    """Synchronous permission check (runs in threadpool)."""
    db_gen = get_session()
    try:
        db = next(db_gen)
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
    except Exception:
        return False
    finally:
        db_gen.close()


async def check_permission_async(user_id: int, permission_name: str) -> bool:
    """Async wrapper that runs the sync check in a threadpool."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _check_permission_sync, user_id, permission_name)


# ---------------------------------------------------------------------------
# Connection handler — extracts token, validates, joins rooms
# ---------------------------------------------------------------------------

def register_connection_handlers(socket_event: Any) -> None:
    @socket_event
    async def connect(sid: str, environ: dict[str, Any]) -> bool | None:
        print(f"\u001b[32mSocket Connection attempt: {sid}\u001b[0m")

        # Extract JWT from cookie header
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

        # Validate token (non-throwing variant returns None on failure).
        # Hold the session generator across the call and close it deterministically
        # so the pooled connection is returned immediately (no GC-reliant cleanup).
        db_gen = get_session()
        try:
            user_info = get_current_user_from_token(
                extract_bearer_from_cookie_value(token_cookie),
                next(db_gen),
            )
        finally:
            db_gen.close()

        if not user_info:
            print(f"\u001b[31mConnection rejected (invalid token): {sid}\u001b[0m")
            await socket_disconnect(sid)
            return False

        user_id = user_info.id
        if user_id is None:
            print(f"\u001b[31mConnection rejected (user id missing): {sid}\u001b[0m")
            await socket_disconnect(sid)
            return False

        # Save session and join rooms
        await socket_save_session(sid, {"user_id": user_id})
        await socket_enter_room(sid, f"user_{user_id}")
        await socket_enter_room(sid, f"role_{user_info.role_id}")

        state.user_sids[user_id].add(sid)
        state.sid_user[sid] = user_id

        print(f"\u001b[32mSocket Connected: {sid} (User ID: {user_id})\u001b[0m")
        return True
