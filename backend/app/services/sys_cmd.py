import os
import pty
import fcntl
import asyncio
import struct
import termios
import signal
from typing import Awaitable, Callable, Optional

class TerminalService:
    def __init__(self):
        self.master_fd: Optional[int] = None
        self.pid: Optional[int] = None
        self._read_task: Optional[asyncio.Task[None]] = None

    async def start_shell(self, callback: Callable[[str], Awaitable[None]]) -> None:
        self.pid, self.master_fd = pty.fork()

        if self.pid == 0:  # Child process
            # Termux environment setup
            shell = os.environ.get("SHELL", "bash") 
            os.environ["TERM"] = "xterm-256color"
            os.chdir(os.environ.get("HOME", "/home"))
            os.execlp(shell, shell)
        else:  # Parent process
            # 1. SET NON-BLOCKING
            flags = fcntl.fcntl(self.master_fd, fcntl.F_GETFL)
            fcntl.fcntl(self.master_fd, fcntl.F_SETFL, flags | os.O_NONBLOCK)
            
            # 2. OPTIONAL: Force "sane" terminal modes (fixes some garbled text)
            try:
                mode = termios.tcgetattr(self.master_fd)
                mode[3] = mode[3] | termios.ECHO  # Let the PTY handle the echo
                termios.tcsetattr(self.master_fd, termios.TCSANOW, mode)
            except:
                pass

            # 3. START THE READ LOOP
            self._read_task = asyncio.create_task(self._read_loop(callback))

    async def _read_loop(self, callback: Callable[[str], Awaitable[None]]) -> None:
        while self.master_fd is not None:
            try:
                # Check if there is data to read without blocking
                data = os.read(self.master_fd, 4096) 
                if data == b"":
                    break
                if data:
                    # Send the decoded string. 
                    # Use 'replace' to avoid crashing on partial multi-byte chars
                    decoded_data = data.decode(errors='replace')
                    await callback(decoded_data)
            except (OSError, BlockingIOError):
                # No data available right now, wait a tiny bit
                await asyncio.sleep(0.02)
                # await asyncio.get_event_loop().run_in_executor(...)
            except Exception as e:
                print(f"Read Error: {e}")
                break

        if self.master_fd is not None:
            try:
                os.close(self.master_fd)
            except OSError:
                pass
            self.master_fd = None
        self._read_task = None

    async def write_input(self, data: str) -> None:
        if self.master_fd is not None:
            # print(f"Sending to PTY: {repr(data)}") # Debug print
            os.write(self.master_fd, data.encode())

    def resize(self, rows: int, cols: int):
        """Adjusts the 'window size' inside the PTY."""
        if self.master_fd is not None:
            s = struct.pack('HHHH', rows, cols, 0, 0)
            fcntl.ioctl(self.master_fd, termios.TIOCSWINSZ, s)

    async def stop(self, pid: Optional[int] = None) -> Optional[int]:
        target_pid = pid or self.pid

        if self.master_fd is not None:
            try:
                os.close(self.master_fd)
            except OSError:
                pass
            self.master_fd = None

        if target_pid is None:
            self.pid = None
            return None

        # Try graceful termination first, then force kill if needed.
        try:
            os.kill(target_pid, signal.SIGHUP)
        except ProcessLookupError:
            pass
        except OSError:
            pass

        for _ in range(20):
            try:
                pid_result, _ = os.waitpid(target_pid, os.WNOHANG)
                if pid_result == target_pid:
                    self.pid = None
                    return target_pid
            except ChildProcessError:
                self.pid = None
                return target_pid
            except OSError:
                pass
            await asyncio.sleep(0.05)

        try:
            os.kill(target_pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        except OSError:
            pass

        for _ in range(20):
            try:
                pid_result, _ = os.waitpid(target_pid, os.WNOHANG)
                if pid_result == target_pid:
                    self.pid = None
                    return target_pid
            except ChildProcessError:
                self.pid = None
                return target_pid
            except OSError:
                pass
            await asyncio.sleep(0.05)

        # Last resort: block in a worker thread to reap defunct child reliably.
        try:
            await asyncio.wait_for(
                asyncio.to_thread(os.waitpid, target_pid, 0),
                timeout=2.0,
            )
        except (asyncio.TimeoutError, ChildProcessError, OSError):
            pass

        if self._read_task is not None:
            self._read_task.cancel()
            self._read_task = None

        self.pid = None
        return target_pid

# import asyncio
# import signal
# from typing import List, Optional, Union, AsyncGenerator

# class SystemServices:
#     def __init__(self):
#         # Stores the current active process
#         self._process: Optional[asyncio.subprocess.Process] = None

#     async def execute_command(
#         self, 
#         command: str, 
#         args: List[str] = None, 
#         capture_output: bool = True,
#         is_long_running: bool = False
#     ) -> Union[str, None]:
#         """
#         Executes a terminal command.
#         :param command: The base executable (e.g., 'ls' or 'python3')
#         :param args: List of arguments (e.g., ['-la', '/home'])
#         :param capture_output: If True, returns stdout as a string.
#         :param is_long_running: If True, starts the process and returns immediately.
#         """
#         args = args or []
        
#         try:
#             # Create the process
#             self._process = await asyncio.create_subprocess_exec(
#                 command,
#                 *args,
#                 stdout=asyncio.subprocess.PIPE if capture_output else asyncio.subprocess.DEVNULL,
#                 stderr=asyncio.subprocess.PIPE
#             )

#             if is_long_running:
#                 print(f"Process {command} started with PID {self._process.pid}")
#                 return None

#             # Wait for completion and gather output
#             stdout, stderr = await self._process.communicate()

#             if self._process.returncode != 0:
#                 error_msg = stderr.decode().strip()
#                 print(f"Error executing {command}: {error_msg}")
#                 return None

#             return stdout.decode().strip() if capture_output else None

#         except Exception as e:
#             print(f"Failed to run command: {e}")
#             return None

#     async def execute_and_report(self, command: str, args: List[str], callback):
#         process = await asyncio.create_subprocess_exec(
#             command, *args,
#             stdout=asyncio.subprocess.PIPE,
#             stderr=asyncio.subprocess.STDOUT
#         )
        
#         async for line in process.stdout:
#             # We call whatever 'callback' function was passed in
#             await callback(line.decode().strip())
        
#         await process.wait()

#     async def stream_command(self, command: str, args: List[str] = None) -> AsyncGenerator[str, None]:
#         """
#         Executes a command and yields each line of output as it is produced.
#         """
#         args = args or []
        
#         try:
#             self._process = await asyncio.create_subprocess_exec(
#                 command,
#                 *args,
#                 stdout=asyncio.subprocess.PIPE,
#                 stderr=asyncio.subprocess.STDOUT  # Redirect stderr to stdout to catch errors in the stream
#             )

#             # Iterate over the stream line by line
#             async for line in self._process.stdout:
#                 if line:
#                     # Decode and strip newline characters
#                     yield line.decode().strip()

#             # Wait for the process to close properly
#             await self._process.wait()

#         except Exception as e:
#             yield f"Streaming error: {e}"
#         finally:
#             self._process = None

#     async def kill_current_process(self):
#         """Terminates the stored process if it is still running."""
#         if self._process and self._process.returncode is None:
#             try:
#                 print(f"Terminating process {self._process.pid}...")
#                 self._process.terminate()  # Graceful exit
#                 # Wait a moment for it to close, or force kill
#                 try:
#                     await asyncio.wait_for(self._process.wait(), timeout=3.0)
#                 except asyncio.TimeoutError:
#                     self._process.kill() # Forceful exit
                
#                 print("Process stopped.")
#             except Exception as e:
#                 print(f"Error killing process: {e}")
#         else:
#             print("No active process to kill.")