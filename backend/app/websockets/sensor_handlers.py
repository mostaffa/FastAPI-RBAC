import asyncio
from typing import Any

from sqlmodel import select

from app.models.permission import Permission, RolePermission
from app.models.user import User
from app.services.sensor import sensor_service
from app.websockets import state
from app.websockets.auth import db_session_scope, has_permission
from app.websockets.socket_server import emit, sio


class _SubscribersEmitter:
    def __init__(self, subscription_type: str):
        self.subscription_type = subscription_type

    async def emit(self, event: str, data: dict[str, Any]) -> None:
        if self.subscription_type == "temperature":
            subscribers = list(state.temperature_sessions.keys())
        elif self.subscription_type == "memory":
            subscribers = list(state.memory_sessions.keys())
        elif self.subscription_type == "cpu":
            subscribers = list(state.cpu_sessions.keys())
        elif self.subscription_type == "disk":
            subscribers = list(state.disk_sessions.keys())
        else:
            subscribers = []

        if not subscribers:
            if self.subscription_type == "temperature":
                sensor_service.stop_temp_monitoring()
            elif self.subscription_type == "memory":
                sensor_service.stop_mem_monitoring()
            elif self.subscription_type == "cpu":
                sensor_service.stop_cpu_monitoring()
            elif self.subscription_type == "disk":
                sensor_service.stop_disk_monitoring()
            return

        for subscriber_sid in subscribers:
            await sio.emit(event, data, room=subscriber_sid)


async def cleanup_sensor_subscriptions(sid: str) -> None:
    state.temperature_sessions.pop(sid, None)
    if not state.temperature_sessions:
        sensor_service.stop_temp_monitoring()
        async with state._temp_monitor_lock:
            if state._temp_monitor_task and not state._temp_monitor_task.done():
                state._temp_monitor_task.cancel()

    state.memory_sessions.pop(sid, None)
    if not state.memory_sessions:
        sensor_service.stop_mem_monitoring()
        async with state._memory_monitor_lock:
            if state._memory_monitor_task and not state._memory_monitor_task.done():
                state._memory_monitor_task.cancel()

    state.cpu_sessions.pop(sid, None)
    if not state.cpu_sessions:
        sensor_service.stop_cpu_monitoring()
        async with state._cpu_monitor_lock:
            if state._cpu_monitor_task and not state._cpu_monitor_task.done():
                state._cpu_monitor_task.cancel()

    state.disk_sessions.pop(sid, None)
    if not state.disk_sessions:
        sensor_service.stop_disk_monitoring()
        async with state._disk_monitor_lock:
            if state._disk_monitor_task and not state._disk_monitor_task.done():
                state._disk_monitor_task.cancel()


def register_sensor_handlers(socket_event: Any) -> None:
    @socket_event
    async def sensor_list(sid: str, message: dict[str, Any]):
        print(f"\u001b[32mSensor Message Request Incomming: {sid}\u001b[0m")
        print(message)
        user_id = state.sid_user[sid]
        with db_session_scope() as db:
            user: User | None = db.exec(select(User).where(User.id == user_id)).first()
            if not user:
                print(f"\u001b[31mUser not found for SID: {sid}\u001b[0m")
                await emit(
                    event="error",
                    data={"code": 404, "message": "User not found"},
                    room=sid,
                )
                return
            sensor_read_perm = db.exec(
                select(Permission)
                .join(RolePermission)
                .where(RolePermission.role_id == user.role_id)
                .where(Permission.name == "sensors:read")
            ).all()

        if sensor_read_perm:
            print("User Has Sensor Read Permission")
            data = await sensor_service.get_sensor_list()
            print(data)
            await emit(event="msg", data={"type": "sensors", "payload": data})
        else:
            print("User Dosent Has Sensor Read Permission")
            await emit(
                event="error",
                data={"code": 403, "message": "You dont have permission to read Sensors"},
            )

    @socket_event
    async def temp_realtime_start(sid: str, message: dict):
        del message
        user_id = state.sid_user[sid]
        if not has_permission(user_id, "sensors:read"):
            print(f"\u001b[31mUser {user_id} does not have permission to read sensors\u001b[0m")
            await emit(
                event="error",
                data={"code": 403, "message": "You dont have permission to read Sensors"},
                room=sid,
            )
            return

        state.temperature_sessions[sid] = user_id

        async with state._temp_monitor_lock:
            if state._temp_monitor_task and not state._temp_monitor_task.done():
                if sensor_service.temp_realtime:
                    return

            async def _run_temp_monitor() -> None:
                this_task = asyncio.current_task()
                try:
                    await sensor_service.start_temp_monitoring(_SubscribersEmitter("temperature"))
                except asyncio.CancelledError:
                    pass
                finally:
                    if state._temp_monitor_task is this_task:
                        state._temp_monitor_task = None

            state._temp_monitor_task = asyncio.create_task(_run_temp_monitor())

    @socket_event
    async def temp_realtime_stop(sid: str, message: dict):
        del message
        state.temperature_sessions.pop(sid, None)
        if not state.temperature_sessions:
            sensor_service.stop_temp_monitoring()
            async with state._temp_monitor_lock:
                if state._temp_monitor_task and not state._temp_monitor_task.done():
                    state._temp_monitor_task.cancel()

    @socket_event
    async def mem_realtime_start(sid: str, message: dict):
        del message
        user_id = state.sid_user[sid]
        if not has_permission(user_id, "sensors:read"):
            print(f"\u001b[31mUser {user_id} does not have permission to read sensors\u001b[0m")
            await emit(
                event="error",
                data={"code": 403, "message": "You dont have permission to read Sensors"},
                room=sid,
            )
            return

        state.memory_sessions[sid] = user_id
        async with state._memory_monitor_lock:
            if state._memory_monitor_task and not state._memory_monitor_task.done():
                if sensor_service.mem_realtime:
                    return

            async def _run_memory_monitor() -> None:
                this_task = asyncio.current_task()
                try:
                    await sensor_service.start_mem_monitoring(_SubscribersEmitter("memory"))
                except asyncio.CancelledError:
                    pass
                finally:
                    if state._memory_monitor_task is this_task:
                        state._memory_monitor_task = None

            state._memory_monitor_task = asyncio.create_task(_run_memory_monitor())

    @socket_event
    async def mem_realtime_stop(sid: str, message: dict):
        del message
        state.memory_sessions.pop(sid, None)
        if not state.memory_sessions:
            sensor_service.stop_mem_monitoring()
            async with state._memory_monitor_lock:
                if state._memory_monitor_task and not state._memory_monitor_task.done():
                    state._memory_monitor_task.cancel()

    @socket_event
    async def cpu_realtime_start(sid: str, message: dict):
        del message
        user_id = state.sid_user[sid]
        if not has_permission(user_id, "sensors:read"):
            print(f"\u001b[31mUser {user_id} does not have permission to read sensors\u001b[0m")
            await emit(
                event="error",
                data={"code": 403, "message": "You dont have permission to read Sensors"},
                room=sid,
            )
            return

        state.cpu_sessions[sid] = user_id
        async with state._cpu_monitor_lock:
            if state._cpu_monitor_task and not state._cpu_monitor_task.done():
                if sensor_service.cpu_realtime:
                    return

            async def _run_cpu_monitor() -> None:
                this_task = asyncio.current_task()
                try:
                    await sensor_service.start_cpu_monitoring(_SubscribersEmitter("cpu"))
                except asyncio.CancelledError:
                    pass
                finally:
                    if state._cpu_monitor_task is this_task:
                        state._cpu_monitor_task = None

            state._cpu_monitor_task = asyncio.create_task(_run_cpu_monitor())

    @socket_event
    async def cpu_realtime_stop(sid: str, message: dict):
        del message
        state.cpu_sessions.pop(sid, None)
        if not state.cpu_sessions:
            sensor_service.stop_cpu_monitoring()
            async with state._cpu_monitor_lock:
                if state._cpu_monitor_task and not state._cpu_monitor_task.done():
                    state._cpu_monitor_task.cancel()

    @socket_event
    async def disk_realtime_start(sid: str, message: dict):
        del message
        user_id = state.sid_user[sid]
        if not has_permission(user_id, "sensors:read"):
            print(f"\u001b[31mUser {user_id} does not have permission to read sensors\u001b[0m")
            await emit(
                event="error",
                data={"code": 403, "message": "You dont have permission to read Sensors"},
                room=sid,
            )
            return

        state.disk_sessions[sid] = user_id
        async with state._disk_monitor_lock:
            if state._disk_monitor_task and not state._disk_monitor_task.done():
                if sensor_service.disk_realtime:
                    return

            async def _run_disk_monitor() -> None:
                this_task = asyncio.current_task()
                try:
                    await sensor_service.start_disk_monitoring(_SubscribersEmitter("disk"))
                except asyncio.CancelledError:
                    pass
                finally:
                    if state._disk_monitor_task is this_task:
                        state._disk_monitor_task = None

            state._disk_monitor_task = asyncio.create_task(_run_disk_monitor())

    @socket_event
    async def disk_realtime_stop(sid: str, message: dict):
        del message
        state.disk_sessions.pop(sid, None)
        if not state.disk_sessions:
            sensor_service.stop_disk_monitoring()
            async with state._disk_monitor_lock:
                if state._disk_monitor_task and not state._disk_monitor_task.done():
                    state._disk_monitor_task.cancel()
