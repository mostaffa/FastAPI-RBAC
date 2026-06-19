"""Sensor WebSocket handlers — DRY, async-safe, with centralized monitoring.

This module replaces the duplicated start/stop handlers for each sensor type
with a single generic handler class that manages all sensor subscriptions.
"""

from __future__ import annotations

import asyncio
from typing import Any, Callable

from sqlmodel import select

from app.db.session import get_session
from app.models.permission import Permission, RolePermission
from app.models.user import User
from app.services.sensor import sensor_service
from app.websockets import state
from app.websockets.socket_server import emit, sio


# ---------------------------------------------------------------------------
# Permission check — runs in executor to avoid blocking event loop
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


# ---------------------------------------------------------------------------
# Generic sensor subscription handler
# ---------------------------------------------------------------------------

class _SensorHandler:
    """Generic handler for a single sensor type (cpu, memory, disk, temp).

    This class encapsulates the common start/stop/cleanup logic for all
    sensor types, eliminating ~80% of the duplicated code from the original.
    """

    def __init__(self, sensor_type: str, permission: str):
        self.sensor_type = sensor_type  # "cpu", "memory", "disk", "temperature"
        self.permission = permission

    # --- Lookup helpers ---

    def _get_sessions(self) -> dict[str, int]:
        match self.sensor_type:
            case "cpu":
                return state.cpu_sessions
            case "memory":
                return state.memory_sessions
            case "disk":
                return state.disk_sessions
            case "temperature":
                return state.temperature_sessions
        return {}

    def _get_task_ref(self) -> str:
        match self.sensor_type:
            case "cpu":
                return "_cpu_monitor_task"
            case "memory":
                return "_memory_monitor_task"
            case "disk":
                return "_disk_monitor_task"
            case "temperature":
                return "_temp_monitor_task"
        raise ValueError(f"Unknown sensor type: {self.sensor_type}")

    def _get_lock(self) -> asyncio.Lock:
        match self.sensor_type:
            case "cpu":
                return state._cpu_monitor_lock
            case "memory":
                return state._memory_monitor_lock
            case "disk":
                return state._disk_monitor_lock
            case "temperature":
                return state._temp_monitor_lock
        raise ValueError(f"Unknown sensor type: {self.sensor_type}")

    def _get_stop_fn(self) -> Callable[[], None]:
        match self.sensor_type:
            case "cpu":
                return sensor_service.stop_cpu_monitoring
            case "memory":
                return sensor_service.stop_mem_monitoring
            case "disk":
                return sensor_service.stop_disk_monitoring
            case "temperature":
                return sensor_service.stop_temp_monitoring
        raise ValueError(f"Unknown sensor type: {self.sensor_type}")

    def _get_realtime_attr(self) -> str:
        match self.sensor_type:
            case "cpu":
                return "cpu_realtime"
            case "memory":
                return "mem_realtime"
            case "disk":
                return "disk_realtime"
            case "temperature":
                return "temp_realtime"
        raise ValueError(f"Unknown sensor type: {self.sensor_type}")

    def _get_start_fn(self) -> Callable[[Any], Any]:
        match self.sensor_type:
            case "cpu":
                return sensor_service.start_cpu_monitoring
            case "memory":
                return sensor_service.start_mem_monitoring
            case "disk":
                return sensor_service.start_disk_monitoring
            case "temperature":
                return sensor_service.start_temp_monitoring
        raise ValueError(f"Unknown sensor type: {self.sensor_type}")

    # --- Start handler ---

    async def handle_start(self, sid: str, message: dict) -> None:
        """Handle sensor subscription start."""
        del message  # unused

        user_id = state.sid_user.get(sid)
        if user_id is None:
            return

        # Check permission (run in executor to avoid blocking event loop)
        loop = asyncio.get_event_loop()
        has_perm = await loop.run_in_executor(
            None, _check_permission_sync, user_id, self.permission
        )
        if not has_perm:
            await emit(
                event="error",
                data={
                    "code": 403,
                    "message": f"You don't have permission to read {self.sensor_type}",
                },
                room=sid,
            )
            return

        sessions = self._get_sessions()
        sessions[sid] = user_id

        lock = self._get_lock()
        async with lock:
            current_task = getattr(state, self._get_task_ref())
            if current_task and not current_task.done():
                realtime_attr = self._get_realtime_attr()
                if getattr(sensor_service, realtime_attr):
                    return

            start_fn = self._get_start_fn()

            async def _run_monitor() -> None:
                this_task = asyncio.current_task()
                try:
                    await start_fn(_SubscribersEmitter(self.sensor_type))
                except asyncio.CancelledError:
                    pass
                finally:
                    # Clear the task reference only if it's still ours
                    if getattr(state, self._get_task_ref()) is this_task:
                        setattr(state, self._get_task_ref(), None)

            match self.sensor_type:
                case "cpu":
                    state._cpu_monitor_task = asyncio.create_task(_run_monitor())
                case "memory":
                    state._memory_monitor_task = asyncio.create_task(_run_monitor())
                case "disk":
                    state._disk_monitor_task = asyncio.create_task(_run_monitor())
                case "temperature":
                    state._temp_monitor_task = asyncio.create_task(_run_monitor())

    # --- Stop handler ---

    async def handle_stop(self, sid: str, message: dict) -> None:
        """Handle sensor subscription stop."""
        del message

        sessions = self._get_sessions()
        sessions.pop(sid, None)

        if not sessions:
            self._get_stop_fn()()
            lock = self._get_lock()
            async with lock:
                task = getattr(state, self._get_task_ref())
                if task and not task.done():
                    task.cancel()

    # --- Registration ---

    def register(self, socket_event: Any) -> None:
        """Register start/stop handlers under the sensor's own event names.

        Uses ``sio.on`` with explicit names (e.g. ``temp_realtime_start``) so
        each sensor type keeps its original event name. ``sio.event`` would
        derive the name from the function — always ``_start``/``_stop`` here —
        making all four sensor types collide on the same two events.
        """
        del socket_event  # registration is by explicit event name below
        prefix = self._get_realtime_attr()  # e.g. "temp_realtime"

        async def _start(sid: str, message: dict):
            await self.handle_start(sid, message)

        async def _stop(sid: str, message: dict):
            await self.handle_stop(sid, message)

        sio.on(f"{prefix}_start", _start)
        sio.on(f"{prefix}_stop", _stop)


# ---------------------------------------------------------------------------
# Subscribers emitter — broadcasts sensor data to all subscribers
# ---------------------------------------------------------------------------

class _SubscribersEmitter:
    """Emits sensor data to all connected subscribers for a given type."""

    def __init__(self, subscription_type: str):
        self.subscription_type = subscription_type

    async def emit(self, event: str, data: dict[str, Any]) -> None:
        subscribers = state.get_subscribers(self.subscription_type)

        if not subscribers:
            # Stop the monitor when last subscriber leaves
            match self.subscription_type:
                case "temperature":
                    sensor_service.stop_temp_monitoring()
                case "memory":
                    sensor_service.stop_mem_monitoring()
                case "cpu":
                    sensor_service.stop_cpu_monitoring()
                case "disk":
                    sensor_service.stop_disk_monitoring()
            return

        for subscriber_sid in subscribers:
            await sio.emit(event, data, room=subscriber_sid)


# ---------------------------------------------------------------------------
# Cleanup and registration
# ---------------------------------------------------------------------------

async def cleanup_sensor_subscriptions(sid: str) -> None:
    """Clean up all sensor subscriptions for a disconnected client."""
    for sensor_type in ("temperature", "memory", "cpu", "disk"):
        state.remove_subscriber(sid, sensor_type)

    # Check if any monitors need to be stopped
    for sensor_type in ("temperature", "memory", "cpu", "disk"):
        if not state.get_subscribers(sensor_type):
            match sensor_type:
                case "temperature":
                    sensor_service.stop_temp_monitoring()
                case "memory":
                    sensor_service.stop_mem_monitoring()
                case "cpu":
                    sensor_service.stop_cpu_monitoring()
                case "disk":
                    sensor_service.stop_disk_monitoring()


def register_sensor_handlers(socket_event: Any) -> None:
    """Register all sensor handlers with the Socket.IO server."""
    handlers = [
        _SensorHandler("temperature", "sensors:read"),
        _SensorHandler("memory", "sensors:read"),
        _SensorHandler("cpu", "sensors:read"),
        _SensorHandler("disk", "sensors:read"),
    ]

    for handler in handlers:
        handler.register(socket_event)
