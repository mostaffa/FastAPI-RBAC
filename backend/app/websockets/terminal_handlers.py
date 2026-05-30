from typing import Any

from app.services.sys_cmd import TerminalService
from app.websockets import state
from app.websockets.socket_server import emit


def register_terminal_handlers(socket_event: Any) -> None:
    @socket_event
    async def start_terminal(sid: str, message: None):
        print(f"Start Terminal Request: {message}, SID: {sid}")
        existing_terminal = state.terminal_sessions.pop(sid, None)
        if existing_terminal:
            await existing_terminal.stop()

        terminal = TerminalService()
        state.terminal_sessions[sid] = terminal
        print(f"Total Terminals: {len(state.terminal_sessions)}")

        async def send_to_react(data: str):
            await emit(event="terminal_data", data=data, room=sid)

        await terminal.start_shell(send_to_react)
        await emit(event="terminal_pid", data={"terminal_pid": terminal.pid}, room=sid)

    @socket_event
    async def stop_terminal(sid: str, message: None):
        print(f"Stop Terminal Request: {message}, SID: {sid}")
        terminal = state.terminal_sessions.pop(sid, None)
        if not terminal:
            return

        stopped_pid = await terminal.stop()
        print(f"############## Killing Terminal with PID: {stopped_pid}")
        if stopped_pid is not None:
            await emit(event="terminal_stopped", data={"terminal_pid": stopped_pid}, room=sid)

    @socket_event
    async def terminal_input(sid: str, message: dict):
        terminal = state.terminal_sessions.get(sid)
        if not terminal:
            return

        user_input = message.get("input", "")
        await terminal.write_input(user_input)

    @socket_event
    async def terminal_resize(sid: str, message: dict):
        print(f"Terminal Resize: {message}, SID: {sid}")
        terminal = state.terminal_sessions.get(sid)
        if not terminal:
            return

        terminal.resize(message["rows"], message["cols"])
