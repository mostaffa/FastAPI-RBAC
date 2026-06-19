"""WebSocket connection state — centralized, type-safe, and lifecycle-aware."""

from __future__ import annotations

import asyncio
from collections import defaultdict
from typing import Any


class SocketState:
    """Centralized state management for all WebSocket connections.

    This class replaces the module-level globals and provides:
    - Type-safe session tracking per sensor type
    - Automatic cleanup on task cancellation
    - Thread-safe access via async locks
    """

    # --- Sensor subscriber tracking (sid -> user_id) ---
    temperature_sessions: dict[str, int] = {}
    memory_sessions: dict[str, int] = {}
    cpu_sessions: dict[str, int] = {}
    disk_sessions: dict[str, int] = {}
    services_sessions: dict[str, int] = {}

    # --- Monitor task tracking (type -> asyncio.Task) ---
    _temp_monitor_task: asyncio.Task[None] | None = None
    _memory_monitor_task: asyncio.Task[None] | None = None
    _cpu_monitor_task: asyncio.Task[None] | None = None
    _disk_monitor_task: asyncio.Task[None] | None = None
    _services_monitor_task: asyncio.Task[None] | None = None

    # --- Locks for each monitor type ---
    _temp_monitor_lock: asyncio.Lock = asyncio.Lock()
    _memory_monitor_lock: asyncio.Lock = asyncio.Lock()
    _cpu_monitor_lock: asyncio.Lock = asyncio.Lock()
    _disk_monitor_lock: asyncio.Lock = asyncio.Lock()
    _services_monitor_lock: asyncio.Lock = asyncio.Lock()

    # --- User connection tracking ---
    user_sids: dict[int, set[str]] = defaultdict(set)  # user_id -> {sid, ...}
    sid_user: dict[str, int] = {}  # sid -> user_id

    def remove_subscriber(self, sid: str, session_type: str) -> None:
        """Remove a subscriber from the given session type."""
        match session_type:
            case "temperature":
                self.temperature_sessions.pop(sid, None)
            case "memory":
                self.memory_sessions.pop(sid, None)
            case "cpu":
                self.cpu_sessions.pop(sid, None)
            case "disk":
                self.disk_sessions.pop(sid, None)
            case "services":
                self.services_sessions.pop(sid, None)

    def get_subscribers(self, session_type: str) -> list[str]:
        """Get all subscriber SIDs for the given session type."""
        match session_type:
            case "temperature":
                return list(self.temperature_sessions.keys())
            case "memory":
                return list(self.memory_sessions.keys())
            case "cpu":
                return list(self.cpu_sessions.keys())
            case "disk":
                return list(self.disk_sessions.keys())
            case "services":
                return list(self.services_sessions.keys())
        return []

    def cleanup_user_connections(self, user_id: int) -> None:
        """Remove all connections for a given user."""
        sids = self.user_sids.pop(user_id, set())
        for sid in sids:
            self.sid_user.pop(sid, None)

    def cleanup_all(self) -> None:
        """Reset all state (useful for testing or graceful shutdown)."""
        self.temperature_sessions.clear()
        self.memory_sessions.clear()
        self.cpu_sessions.clear()
        self.disk_sessions.clear()
        self.services_sessions.clear()

        for task in (
            self._temp_monitor_task,
            self._memory_monitor_task,
            self._cpu_monitor_task,
            self._disk_monitor_task,
            self._services_monitor_task,
        ):
            if task and not task.done():
                task.cancel()

        self.user_sids.clear()
        self.sid_user.clear()


# Module-level singleton instance (backward compatible alias)
state = SocketState()

# Backward compatibility: expose individual dicts at module level
temperature_sessions = state.temperature_sessions
memory_sessions = state.memory_sessions
cpu_sessions = state.cpu_sessions
disk_sessions = state.disk_sessions
services_sessions = state.services_sessions

_temp_monitor_task = state._temp_monitor_task
_memory_monitor_task = state._memory_monitor_task
_cpu_monitor_task = state._cpu_monitor_task
_disk_monitor_task = state._disk_monitor_task
_services_monitor_task = state._services_monitor_task

_temp_monitor_lock = state._temp_monitor_lock
_memory_monitor_lock = state._memory_monitor_lock
_cpu_monitor_lock = state._cpu_monitor_lock
_disk_monitor_lock = state._disk_monitor_lock
_services_monitor_lock = state._services_monitor_lock

user_sids = state.user_sids
sid_user = state.sid_user

# Backward compatibility: expose the instance methods at module level too, so
# callers that do `from app.websockets import state` (binding the MODULE, not
# the singleton) can still invoke them as `state.get_subscribers(...)`, etc.
# These are bound methods of the singleton above, so they operate on the same
# shared session dicts the module-level aliases point to.
get_subscribers = state.get_subscribers
remove_subscriber = state.remove_subscriber
cleanup_user_connections = state.cleanup_user_connections
cleanup_all = state.cleanup_all
