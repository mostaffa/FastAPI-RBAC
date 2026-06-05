import asyncio
from typing import Any

from app.services.services import services_monitor
from app.websockets import state
from app.websockets.auth import has_permission
from app.websockets.socket_server import emit, sio


class _ServicesSubscribersEmitter:
    async def emit(self, event: str, data: dict[str, Any]) -> None:
        subscribers = list(state.services_sessions.keys())
        if not subscribers:
            services_monitor.stop_services_monitoring()
            return

        for subscriber_sid in subscribers:
            await sio.emit(event, data, room=subscriber_sid)


async def cleanup_services_subscriptions(sid: str) -> None:
    state.services_sessions.pop(sid, None)
    if not state.services_sessions:
        services_monitor.stop_services_monitoring()
        async with state._services_monitor_lock:
            if (
                state._services_monitor_task
                and not state._services_monitor_task.done()
            ):
                state._services_monitor_task.cancel()


def register_services_handlers(socket_event: Any) -> None:
    @socket_event
    async def services_list(sid: str, message: dict[str, Any]):
        del message
        user_id = state.sid_user[sid]
        if not has_permission(user_id, "services:read"):
            await emit(
                event="error",
                data={
                    "code": 403,
                    "message": "You dont have permission to read Services",
                },
                room=sid,
            )
            return

        data = await services_monitor.get_services_snapshot(include_details=True)
        await emit(event="msg", data={"type": "services", "payload": data}, room=sid)

    @socket_event
    async def services_realtime_start(sid: str, message: dict[str, Any]):
        del message
        user_id = state.sid_user[sid]
        if not has_permission(user_id, "services:read"):
            await emit(
                event="error",
                data={
                    "code": 403,
                    "message": "You dont have permission to read Services",
                },
                room=sid,
            )
            return

        state.services_sessions[sid] = user_id

        async with state._services_monitor_lock:
            if state._services_monitor_task and not state._services_monitor_task.done():
                if services_monitor.services_realtime:
                    return

            async def _run_services_monitor() -> None:
                this_task = asyncio.current_task()
                try:
                    await services_monitor.start_services_monitoring(_ServicesSubscribersEmitter())
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
                if state._services_monitor_task and not state._services_monitor_task.done():
                    state._services_monitor_task.cancel()

    @socket_event
    async def services_set_state(sid: str, message: dict[str, Any]):
        user_id = state.sid_user[sid]
        if not has_permission(user_id, "services:update"):
            await emit(
                event="error",
                data={
                    "code": 403,
                    "message": "You dont have permission to update Services",
                },
                room=sid,
            )
            return {
                "ok": False,
                "message": "Permission denied",
            }

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
