"""Services WebSocket handlers — DRY, async-safe monitoring.

Replaces the duplicated services handler with a clean, centralized approach.
"""

from __future__ import annotations

import asyncio
from typing import Any

from app.services.services import services_monitor
from app.websockets import state
from app.websockets.socket_server import emit, sio_ref


# ---------------------------------------------------------------------------
# Subscribers emitter — broadcasts services data to all subscribers
# ---------------------------------------------------------------------------

class _ServicesSubscribersEmitter:
    async def emit(self, event: str, data: dict[str, Any]) -> None:
        subscribers = state.get_subscribers("services")

        if not subscribers:
            services_monitor.stop_services_monitoring()
            return

        for subscriber_sid in subscribers:
            await sio_ref.emit(event, data, room=subscriber_sid)


# ---------------------------------------------------------------------------
# Cleanup on disconnect
# ---------------------------------------------------------------------------

async def cleanup_services_subscriptions(sid: str) -> None:
    state.services_sessions.pop(sid, None)

    if not state.services_sessions:
        services_monitor.stop_services_monitoring()
        async with state._services_monitor_lock:
            task = state._services_monitor_task
            if task and not task.done():
                task.cancel()


# ---------------------------------------------------------------------------
# Permission check (runs in executor to avoid blocking event loop)
# ---------------------------------------------------------------------------

def _check_services_permission_sync(user_id: int, permission_name: str) -> bool:
    """Synchronous permission check for services."""
    from contextlib import contextmanager
    from sqlmodel import select

    @contextmanager
    def db_session_scope():
        from app.db.session import get_session
        db_gen = get_session()
        db = next(db_gen)
        try:
            yield db
        finally:
            db_gen.close()

    from app.models.permission import Permission, RolePermission
    from app.models.user import User

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


# ---------------------------------------------------------------------------
# Services handlers — list, realtime start/stop, state update
# ---------------------------------------------------------------------------

def register_services_handlers(socket_event: Any) -> None:
    """Register all services handlers with the Socket.IO server."""

    @socket_event
    async def services_list(sid: str, message: dict[str, Any]):
        del message

        user_id = state.sid_user.get(sid)
        if not user_id:
            return

        loop = asyncio.get_event_loop()
        has_perm = await loop.run_in_executor(
            None, _check_services_permission_sync, user_id, "services:read"
        )
        if not has_perm:
            await emit(
                event="error",
                data={"code": 403, "message": "You don't have permission to read Services"},
                room=sid,
            )
            return

        data = await services_monitor.get_services_snapshot(include_details=True)
        await emit(event="msg", data={"type": "services", "payload": data}, room=sid)

    @socket_event
    async def services_realtime_start(sid: str, message: dict[str, Any]):
        del message

        user_id = state.sid_user.get(sid)
        if not user_id:
            return

        loop = asyncio.get_event_loop()
        has_perm = await loop.run_in_executor(
            None, _check_services_permission_sync, user_id, "services:read"
        )
        if not has_perm:
            await emit(
                event="error",
                data={"code": 403, "message": "You don't have permission to read Services"},
                room=sid,
            )
            return

        state.services_sessions[sid] = user_id

        async with state._services_monitor_lock:
            if (
                state._services_monitor_task
                and not state._services_monitor_task.done()
            ):
                if services_monitor.services_realtime:
                    return

            async def _run_services_monitor() -> None:
                this_task = asyncio.current_task()
                try:
                    await services_monitor.start_services_monitoring(
                        _ServicesSubscribersEmitter()
                    )
                except asyncio.CancelledError:
                    pass
                finally:
                    if state._services_monitor_task is this_task:
                        state._services_monitor_task = None

            state._services_monitor_task = asyncio.create_task(_run_services_monitor())

    @socket_event
    async def services_realtime_stop(sid: str, message: dict[str, Any]):
        del message

        state.services_sessions.pop(sid, None)

        if not state.services_sessions:
            services_monitor.stop_services_monitoring()
            async with state._services_monitor_lock:
                task = state._services_monitor_task
                if task and not task.done():
                    task.cancel()

    @socket_event
    async def services_set_state(sid: str, message: dict[str, Any]):
        user_id = state.sid_user.get(sid)
        if not user_id:
            return

        loop = asyncio.get_event_loop()
        has_perm = await loop.run_in_executor(
            None, _check_services_permission_sync, user_id, "services:update"
        )
        if not has_perm:
            await emit(
                event="error",
                data={
                    "code": 403,
                    "message": "You don't have permission to update Services",
                },
                room=sid,
            )
            return {"ok": False, "message": "Permission denied"}

        source = str(message.get("source", "")).strip().lower()
        name = str(message.get("name", "")).strip()
        enabled = bool(message.get("enabled", False))

        result = await services_monitor.set_service_state(source, name, enabled)
        if not result.get("ok"):
            await emit(
                event="notification",
                data={
                    "type": "error",
                    "code": 400,
                    "message": str(result.get("message", "Failed to update service state")),
                },
                room=sid,
            )
            return result

        await emit(
            event="notification",
            data={
                "type": "success",
                "code": 200,
                "message": str(result.get("message", "Service updated")),
            },
            room=sid,
        )

        snapshot = await services_monitor.get_services_snapshot(include_details=True)
        await emit(event="msg", data={"type": "services", "payload": snapshot}, room=sid)

        return result
