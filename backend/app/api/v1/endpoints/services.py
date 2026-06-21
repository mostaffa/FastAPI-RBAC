from fastapi import APIRouter, Depends, Query

from app.core.rbac import require_permission
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.services import (
    ServiceStateUpdateRequest,
    ServiceStateUpdateResponse,
    ServicesSnapshot,
)
from app.services.services import services_monitor

router = APIRouter()


@router.get(
    "/",
    response_model=ServicesSnapshot,
    dependencies=[Depends(require_permission("services:read"))],
)
async def read_services(
    include_details: bool = Query(default=False),
    current_user: User = Depends(get_current_user),
) -> ServicesSnapshot:
    del current_user

    payload = await services_monitor.get_services_snapshot(
        include_details=include_details,
    )
    return payload


@router.post(
    "/state",
    response_model=ServiceStateUpdateResponse,
    dependencies=[Depends(require_permission("services:update"))],
)
async def update_service_state(
    body: ServiceStateUpdateRequest,
    current_user: User = Depends(get_current_user),
) -> ServiceStateUpdateResponse:
    del current_user

    result = await services_monitor.set_service_state(
        body.source,
        body.name,
        body.enabled,
    )
    return result
