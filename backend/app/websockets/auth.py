"""Socket.IO authentication — token extraction, validation, and room joining.

Handles WebSocket connection authentication using JWT tokens from cookie
headers.
"""

from __future__ import annotations

from http.cookies import SimpleCookie
from typing import Any

from app.core.security import extract_bearer_from_cookie_value, get_current_user_from_token
from app.db.session import get_session
from app.websockets import state
from app.websockets.socket_server import socket_disconnect, socket_enter_room, socket_save_session


# ---------------------------------------------------------------------------
# Connection handler — extracts token, validates, joins rooms
# ---------------------------------------------------------------------------

def register_connection_handlers(socket_event: Any) -> None:
    @socket_event
    async def connect(sid: str, environ: dict[str, Any]) -> bool | None:
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
            await socket_disconnect(sid)
            return False

        user_id = user_info.id
        if user_id is None:
            await socket_disconnect(sid)
            return False

        # Save session and join rooms
        await socket_save_session(sid, {"user_id": user_id})
        await socket_enter_room(sid, f"user_{user_id}")
        await socket_enter_room(sid, f"role_{user_info.role_id}")

        state.user_sids[user_id].add(sid)
        state.sid_user[sid] = user_id

        return True
