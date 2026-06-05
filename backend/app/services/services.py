import asyncio
import json
from datetime import datetime, timezone
from typing import Any


class ServicesMonitor:
    services_realtime = False

    @staticmethod
    def _is_service_name_safe(name: str) -> bool:
        if not name or any(char.isspace() for char in name):
            return False
        return True

    @staticmethod
    async def _run_command(command: list[str], timeout: float = 4.0) -> tuple[int, str, str]:
        try:
            process = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
        except FileNotFoundError:
            return 127, "", f"command not found: {command[0]}"
        except Exception as exc:  # pragma: no cover - defensive guard
            return 1, "", str(exc)

        try:
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=timeout)
        except asyncio.TimeoutError:
            process.kill()
            await process.communicate()
            return 124, "", "command timed out"

        return process.returncode or 0, stdout.decode().strip(), stderr.decode().strip()

    @staticmethod
    async def _list_linux_services(
        include_details: bool = True,
    ) -> tuple[list[dict[str, Any]], bool, str | None]:
        code, stdout, stderr = await ServicesMonitor._run_command(
            [
                "systemctl",
                "list-units",
                "--type=service",
                "--all",
                "--no-legend",
                "--no-pager",
                "--plain",
            ]
        )

        if code != 0:
            message = stderr or stdout or "systemctl unavailable"
            return [], False, message

        services: list[dict[str, Any]] = []
        for line in stdout.splitlines():
            line = line.strip()
            if not line:
                continue

            parts = line.split(None, 4)
            if len(parts) < 4:
                continue

            unit = parts[0]
            load_state = parts[1]
            active_state = parts[2]
            sub_state = parts[3]
            description = parts[4] if len(parts) > 4 else ""

            service: dict[str, Any] = {
                "id": f"linux:{unit}",
                "source": "linux",
                "name": unit,
                "load_state": load_state,
                "state": active_state,
                "is_active": active_state == "active",
                "sub_state": sub_state,
            }
            if include_details:
                service["description"] = description

            services.append(service)

        return services, True, None

    @staticmethod
    async def _list_docker_services(
        include_details: bool = True,
    ) -> tuple[list[dict[str, Any]], bool, str | None]:
        code, stdout, stderr = await ServicesMonitor._run_command(
            ["docker", "ps", "-a", "--format", "{{json .}}"]
        )

        if code != 0:
            message = stderr or stdout or "docker unavailable"
            return [], False, message

        containers: list[dict[str, Any]] = []
        for line in stdout.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                item = json.loads(line)
            except json.JSONDecodeError:
                continue

            name = item.get("Names") or item.get("ID") or "unknown"
            container: dict[str, Any] = {
                "id": f"docker:{item.get('ID', name)}",
                "source": "docker",
                "name": name,
                "state": item.get("State") or item.get("Status"),
                "is_active": str(item.get("State", "")).lower() == "running",
                "status": item.get("Status"),
            }
            if include_details:
                container["image"] = item.get("Image")
                container["ports"] = item.get("Ports")

            containers.append(container)

        return containers, True, None

    @staticmethod
    async def get_services_snapshot(include_details: bool = True) -> dict[str, Any]:
        linux_items, linux_available, linux_error = await ServicesMonitor._list_linux_services(
            include_details=include_details,
        )
        docker_items, docker_available, docker_error = await ServicesMonitor._list_docker_services(
            include_details=include_details,
        )

        errors: list[dict[str, str]] = []
        if linux_error:
            errors.append({"source": "linux", "message": linux_error})
        if docker_error:
            errors.append({"source": "docker", "message": docker_error})

        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "linux_available": linux_available,
            "docker_available": docker_available,
            "items": linux_items + docker_items,
            "errors": errors,
        }

    @staticmethod
    async def start_services_monitoring(manager: Any, interval_seconds: float = 5.0) -> None:
        if ServicesMonitor.services_realtime:
            return

        ServicesMonitor.services_realtime = True
        while ServicesMonitor.services_realtime:
            payload = await ServicesMonitor.get_services_snapshot(include_details=False)
            await manager.emit("services_realtime", {"data": payload})
            await asyncio.sleep(interval_seconds)

    @staticmethod
    async def set_service_state(source: str, name: str, enabled: bool) -> dict[str, Any]:
        if not ServicesMonitor._is_service_name_safe(name):
            return {
                "ok": False,
                "message": "Invalid service name",
            }

        action = "start" if enabled else "stop"
        if source == "linux":
            code, stdout, stderr = await ServicesMonitor._run_command(
                ["systemctl", action, name],
                timeout=8.0,
            )
        elif source == "docker":
            code, stdout, stderr = await ServicesMonitor._run_command(
                ["docker", action, name],
                timeout=8.0,
            )
        else:
            return {
                "ok": False,
                "message": f"Unsupported service source: {source}",
            }

        if code != 0:
            return {
                "ok": False,
                "message": stderr or stdout or "Failed to change service state",
            }

        return {
            "ok": True,
            "message": f"{action.capitalize()}ed {name}",
        }

    @staticmethod
    def stop_services_monitoring() -> None:
        ServicesMonitor.services_realtime = False


services_monitor = ServicesMonitor()
