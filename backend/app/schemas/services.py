from typing import Literal

from pydantic import BaseModel


ServiceSource = Literal["linux", "docker"]


class ServiceItem(BaseModel):
    id: str
    source: ServiceSource
    name: str
    is_active: bool | None = None
    state: str | None = None
    sub_state: str | None = None
    status: str | None = None
    description: str | None = None
    image: str | None = None
    ports: str | None = None


class ServicesSourceError(BaseModel):
    source: ServiceSource
    message: str


class ServicesSnapshot(BaseModel):
    timestamp: str
    linux_available: bool
    docker_available: bool
    items: list[ServiceItem]
    errors: list[ServicesSourceError]


class ServiceStateUpdateRequest(BaseModel):
    source: ServiceSource
    name: str
    enabled: bool


class ServiceStateUpdateResponse(BaseModel):
    ok: bool
    message: str
