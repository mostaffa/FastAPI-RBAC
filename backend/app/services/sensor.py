import asyncio
import json
import subprocess
import psutil

class SensorService:
    temp_realtime = False
    mem_realtime = False
    cpu_realtime = False
    disk_realtime = False

    def __init__(self):
        self.is_running = False

    @staticmethod
    async def start_temp_monitoring(manager):
        if SensorService.temp_realtime:
            return
        # self.is_running = True
        SensorService.temp_realtime = True

        while SensorService.temp_realtime:
            if not SensorService.temp_realtime:
                break
            print("Emitting temperature data...")
            await manager.emit("temp_realtime", {
                "data": psutil.sensors_temperatures()
            })
            # sleep for a bit to avoid overwhelming the system
            await asyncio.sleep(1)

    @staticmethod
    def stop_temp_monitoring():
        SensorService.temp_realtime = False
    
    async def get_sensor_list(self):
        """Executes 'termux-sensor -l' and returns a parsed list of sensors"""
        process = await asyncio.create_subprocess_exec(
            'termux-sensor', '-l',
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            return {"error": "Failed to fetch sensors", "details": stderr.decode()}

        try:
            # Termux usually returns a JSON array of sensors
            output = stdout.decode().strip()
            return json.loads(output)
        except json.JSONDecodeError:
            # Fallback if the output isn't clean JSON
            return {"raw_output": stdout.decode().strip()}

    @staticmethod
    async def start_mem_monitoring(manager):
        if SensorService.mem_realtime:
            return
        SensorService.mem_realtime = True
        while SensorService.mem_realtime:
            print("Emitting memory data...")
            await manager.emit("mem_realtime", {
                "data": psutil.virtual_memory()._asdict()
            })
            await asyncio.sleep(1)  # Simulate delay in fetching data

    @staticmethod
    def stop_mem_monitoring():
        SensorService.mem_realtime = False

    @staticmethod
    async def start_cpu_monitoring(manager):
        if SensorService.cpu_realtime:
            return
        SensorService.cpu_realtime = True
        while SensorService.cpu_realtime:
            print("Emitting CPU data...")
            cpu_freq = psutil.cpu_freq()
            await manager.emit("cpu_realtime", {
                "data": {
                    "percent": psutil.cpu_percent(interval=None),
                    "count_logical": psutil.cpu_count(logical=True),
                    "count_physical": psutil.cpu_count(logical=False),
                    "freq_current": cpu_freq.current if cpu_freq else None,
                    "freq_min": cpu_freq.min if cpu_freq else None,
                    "freq_max": cpu_freq.max if cpu_freq else None,
                }
            })
            await asyncio.sleep(1)

    @staticmethod
    def stop_cpu_monitoring():
        SensorService.cpu_realtime = False

    @staticmethod
    async def start_disk_monitoring(manager):
        if SensorService.disk_realtime:
            return
        SensorService.disk_realtime = True
        while SensorService.disk_realtime:
            print("Emitting disk data...")
            usage = psutil.disk_usage("/")
            await manager.emit("disk_realtime", {
                "data": {
                    "path": "/",
                    "total": usage.total,
                    "used": usage.used,
                    "free": usage.free,
                    "percent": usage.percent,
                }
            })
            await asyncio.sleep(1)

    @staticmethod
    def stop_disk_monitoring():
        SensorService.disk_realtime = False

sensor_service = SensorService()