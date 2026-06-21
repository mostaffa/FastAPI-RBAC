from pydantic import BaseModel, Field

class TerminalData(BaseModel):
    data: str

class TerminalPID(BaseModel):
    user: str
    pid: int
    cpu_percent: float
    memory_percent: float
    command: str
    time: str
    stat: str
    start: str
    rss: int
    vms: int

class MemoryUsage(BaseModel):
    total: int
    available: int
    percent: float
    used: int
    free: int