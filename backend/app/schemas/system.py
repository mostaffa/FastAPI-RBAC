from datetime import datetime

from pydantic import BaseModel


class SystemInfo(BaseModel):
    hostname: str
    fqdn: str
    os_name: str
    os_release: str
    os_version: str
    platform: str
    architecture: str
    machine: str
    processor: str
    python_version: str
    timezone: str
    boot_time_utc: datetime | None = None
    uptime_seconds: float | None = None
    is_vm: bool
    is_docker: bool
    is_kubernetes: bool
    virtualization_hint: str | None = None
    cpu_count_logical: int | None = None
    cpu_count_physical: int | None = None
    memory_total_bytes: int | None = None
    memory_available_bytes: int | None = None
    disk_total_bytes: int | None = None
    disk_used_bytes: int | None = None
    disk_free_bytes: int | None = None
    mac_address: str | None = None
    ip_addresses: list[str]