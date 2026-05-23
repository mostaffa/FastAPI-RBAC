import asyncio
import json
import subprocess

class SensorService:
    def __init__(self):
        self.is_running = False
        self._process = None

    async def start_monitoring(self, manager):
        if self.is_running:
            return
        self.is_running = True

        self._process = await asyncio.create_subprocess_exec(
            'termux-sensor', '-s', "gravity",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        try:
            while self.is_running:
                line = await self._process.stdout.readline()
                if not line:
                    break
                
                # Termux outputs sensor data in JSON blocks
                data = line.decode().strip()
                if data:
                    try:
                        sensor_json = json.loads(data)
                        # Broadcast to all React clients
                        await manager.emit({
                            "event": "realtime",
                            "type": "sensor_update",
                            "data": sensor_json
                        })
                    except json.JSONDecodeError:
                        continue 
        finally:
            pass
            # self.stop_monitoring()

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

    def stop_monitoring(self):
        self.is_running = False
        if self._process:
            self._process.terminate()
            self._process = None


sensor_service = SensorService()