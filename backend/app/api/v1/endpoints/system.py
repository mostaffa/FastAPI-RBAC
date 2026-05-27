from __future__ import annotations

import os
import platform
import socket
import uuid
from datetime import datetime, timezone
from pathlib import Path

import psutil
from fastapi import APIRouter, Depends

from app.core.rbac import require_permission
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.system import SystemInfo

router = APIRouter()


def _read_file(path: str) -> str:
    try:
        return Path(path).read_text(encoding="utf-8", errors="ignore").strip()
    except OSError:
        return ""


def _detect_docker() -> bool:
    if Path("/.dockerenv").exists():
        return True

    cgroup = _read_file("/proc/1/cgroup").lower()
    return any(marker in cgroup for marker in ("docker", "containerd", "kubepods"))


def _detect_kubernetes() -> bool:
    if os.getenv("KUBERNETES_SERVICE_HOST"):
        return True

    cgroup = _read_file("/proc/1/cgroup").lower()
    return "kubepods" in cgroup


def _detect_vm() -> tuple[bool, str | None]:
    cpuinfo = _read_file("/proc/cpuinfo").lower()
    if "hypervisor" in cpuinfo:
        return True, "cpu-hypervisor-flag"

    dmi_sources = [
        "/sys/class/dmi/id/product_name",
        "/sys/class/dmi/id/sys_vendor",
        "/sys/class/dmi/id/board_vendor",
        "/sys/class/dmi/id/bios_vendor",
    ]
    dmi_text = " ".join(_read_file(p).lower() for p in dmi_sources)
    vm_markers = (
        "kvm",
        "vmware",
        "virtualbox",
        "qemu",
        "xen",
        "bhyve",
        "microsoft corporation",
    )
    for marker in vm_markers:
        if marker in dmi_text:
            return True, f"dmi:{marker}"

    return False, None


def _get_ip_addresses() -> list[str]:
    addresses: set[str] = set()
    for iface_addrs in psutil.net_if_addrs().values():
        for addr in iface_addrs:
            if addr.family in (socket.AF_INET, socket.AF_INET6):
                if addr.address and not addr.address.startswith("127.") and addr.address != "::1":
                    addresses.add(addr.address)
    return sorted(addresses)


def _format_mac_from_uuid() -> str | None:
    mac_int = uuid.getnode()
    if (mac_int >> 40) % 2:
        return None
    return ":".join(f"{(mac_int >> ele) & 0xFF:02x}" for ele in range(40, -1, -8))


def _detect_processor_name() -> str:
    # platform.processor() is often empty on Linux, so we fallback to uname/cpuinfo.
    candidates = [
        platform.processor(),
        platform.uname().processor,
    ]
    for value in candidates:
        cleaned = (value or "").strip()
        if cleaned:
            return cleaned

    cpuinfo = _read_file("/proc/cpuinfo")
    preferred_keys = ("model name", "hardware", "cpu")
    fallback_keys = ("processor",)

    def parse_value(keys: tuple[str, ...], skip_numeric_only: bool) -> str | None:
        for line in cpuinfo.splitlines():
            parts = line.split(":", 1)
            if len(parts) != 2:
                continue
            key = parts[0].strip().lower()
            value = parts[1].strip()
            if not value:
                continue
            if not any(key.startswith(k) for k in keys):
                continue
            if skip_numeric_only and value.isdigit():
                continue
            return value
        return None

    preferred = parse_value(preferred_keys, skip_numeric_only=True)
    if preferred:
        return preferred

    fallback = parse_value(fallback_keys, skip_numeric_only=True)
    if fallback:
        return fallback

    return "unknown"


@router.get("/", response_model=SystemInfo, dependencies=[Depends(require_permission("sensors:read"))])
def read_system_info(current_user: User = Depends(get_current_user)) -> SystemInfo:
    del current_user

    now_utc = datetime.now(timezone.utc)
    boot_time_utc: datetime | None = None
    uptime_seconds: float | None = None

    try:
        boot_seconds = psutil.boot_time()
        boot_time_utc = datetime.fromtimestamp(boot_seconds, tz=timezone.utc)
        uptime_seconds = max(0.0, (now_utc - boot_time_utc).total_seconds())
    except (OSError, ValueError):
        pass

    vm_detected, vm_hint = _detect_vm()
    docker_detected = _detect_docker()
    kubernetes_detected = _detect_kubernetes()

    try:
        memory = psutil.virtual_memory()
        memory_total = int(memory.total)
        memory_available = int(memory.available)
    except (OSError, AttributeError):
        memory_total = None
        memory_available = None

    try:
        disk = psutil.disk_usage("/")
        disk_total = int(disk.total)
        disk_used = int(disk.used)
        disk_free = int(disk.free)
    except (OSError, FileNotFoundError):
        disk_total = None
        disk_used = None
        disk_free = None

    return SystemInfo(
        hostname=socket.gethostname(),
        fqdn=socket.getfqdn(),
        os_name=platform.system(),
        os_release=platform.release(),
        os_version=platform.version(),
        platform=platform.platform(),
        architecture=platform.architecture()[0],
        machine=platform.machine(),
        processor=_detect_processor_name(),
        python_version=platform.python_version(),
        timezone=datetime.now().astimezone().tzname() or "unknown",
        boot_time_utc=boot_time_utc,
        uptime_seconds=uptime_seconds,
        is_vm=vm_detected,
        is_docker=docker_detected,
        is_kubernetes=kubernetes_detected,
        virtualization_hint=vm_hint,
        cpu_count_logical=psutil.cpu_count(logical=True),
        cpu_count_physical=psutil.cpu_count(logical=False),
        memory_total_bytes=memory_total,
        memory_available_bytes=memory_available,
        disk_total_bytes=disk_total,
        disk_used_bytes=disk_used,
        disk_free_bytes=disk_free,
        mac_address=_format_mac_from_uuid(),
        ip_addresses=_get_ip_addresses(),
    )