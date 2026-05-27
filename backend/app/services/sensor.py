import asyncio
import json
import subprocess
import psutil

class SensorService:
    temp_realtime = False

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

            # self._process = subprocess.run(
            #     # 'termux-sensor', '-s', "gravity",
            #     'sensors',
            #     text=True,
            #     check=True,
            #     capture_output=True, 
            #     # stdout=subprocess.DEVNULL,
            #     # stderr=subprocess.DEVNULL
            #     # stdout=asyncio.subprocess.PIPE,
            #     # stderr=asyncio.subprocess.PIPE
            # ).stdout
            # print(f"Sensor Output: {self._process}")
            print("Emitting temperature data...")
            await manager.emit("temp_realtime", {
                "data": psutil.sensors_temperatures()
            })
            # sleep for a bit to avoid overwhelming the system
            await asyncio.sleep(1)



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
    def stop_temp_monitoring():
        SensorService.temp_realtime = False


sensor_service = SensorService()