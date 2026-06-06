import asyncio
from collections import defaultdict
from typing import DefaultDict



temperature_sessions: dict[str, int] = {}
# Backward compatible alias for existing code paths using the old typo.
temparature_sessions = temperature_sessions
memory_sessions: dict[str, int] = {}
cpu_sessions: dict[str, int] = {}
disk_sessions: dict[str, int] = {}
services_sessions: dict[str, int] = {}

_temp_monitor_task: asyncio.Task[None] | None = None
_temp_monitor_lock = asyncio.Lock()
_memory_monitor_task: asyncio.Task[None] | None = None
_memory_monitor_lock = asyncio.Lock()
_cpu_monitor_task: asyncio.Task[None] | None = None
_cpu_monitor_lock = asyncio.Lock()
_disk_monitor_task: asyncio.Task[None] | None = None
_disk_monitor_lock = asyncio.Lock()
_services_monitor_task: asyncio.Task[None] | None = None
_services_monitor_lock = asyncio.Lock()

user_sids = defaultdict(set)  # type: DefaultDict[int, set[str]]
sid_user: dict[str, int] = {}
