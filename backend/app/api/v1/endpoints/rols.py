from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from app.core.permissions import build_rooms_for_permission
from app.core.rbac import require_permission_or_superuser
from app.db.session import get_session
from app.models.permission import RolePermission
from app.models.user import Permission, Role
from app.schemas.permission import PermissionRead
from app.schemas.role import RoleCreate, RoleRead
from app.websockets.connection_manager import emit

router = APIRouter()


@router.post(
    "/",
    response_model=RoleRead,
    dependencies=[Depends(require_permission_or_superuser("role:create"))],
)
async def create_role(role_in: RoleCreate, db: Session = Depends(get_session)):
    def _create() -> tuple[RoleRead, list[str]]:
        existing_role = db.exec(select(Role).where(Role.name == role_in.name)).first()
        if existing_role:
            raise HTTPException(status_code=400, detail="Role already exists")

        db_role = Role(name=role_in.name)
        db.add(db_role)
        db.commit()
        db.refresh(db_role)
        return RoleRead.model_validate(db_role), build_rooms_for_permission(db, "role:read")

    role_read, rooms = await run_in_threadpool(_create)
    print("\u001b[34m[WebSocket]\u001b[0m Emitting role_created event to rooms:", rooms)
    await emit(
        "msg",
        {"type": "role_created", "payload": role_read.model_dump()},
        room=rooms,
    )
    return role_read


@router.get(
    "/{role_id}",
    response_model=RoleRead,
    dependencies=[Depends(require_permission_or_superuser("role:read"))],
)
def read_role(role_id: int, db: Session = Depends(get_session)):
    role = db.get(Role, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role


@router.get(
    "/",
    response_model=list[RoleRead],
    dependencies=[Depends(require_permission_or_superuser("role:read"))],
)
def read_roles(db: Session = Depends(get_session)):
    roles = db.exec(select(Role)).all()
    return roles


@router.put(
    "/{role_id}",
    response_model=RoleRead,
    dependencies=[Depends(require_permission_or_superuser("role:update"))],
)
async def update_role(role_id: int, role_in: RoleCreate, db: Session = Depends(get_session)):
    def _update() -> tuple[RoleRead, list[str]]:
        role = db.get(Role, role_id)
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        # Check if new name conflicts with existing role
        if role.name != role_in.name:
            existing_role = db.exec(select(Role).where(Role.name == role_in.name)).first()
            if existing_role:
                raise HTTPException(status_code=400, detail="Role name already exists")
        role.name = role_in.name
        db.add(role)
        db.commit()
        db.refresh(role)
        return RoleRead.model_validate(role), build_rooms_for_permission(db, "role:read")

    role_read, rooms = await run_in_threadpool(_update)
    print("\u001b[32m[WebSocket]\u001b[0m Emitting role_updated event to rooms:", rooms)
    await emit(
        "msg",
        {"type": "role_updated", "payload": role_read.model_dump()},
        room=rooms,
    )
    return role_read


@router.delete(
    "/{role_id}",
    response_model=dict,
    dependencies=[Depends(require_permission_or_superuser("role:delete"))],
)
async def delete_role(role_id: int, db: Session = Depends(get_session)):
    # Prevent deletion of the superuser role.
    if role_id == 1:
        raise HTTPException(status_code=400, detail="Cannot delete superuser role")

    def _delete() -> list[str]:
        role = db.get(Role, role_id)
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        db.delete(role)
        db.commit()
        return build_rooms_for_permission(db, "role:read") + [f"role_{role_id}"]

    rooms = await run_in_threadpool(_delete)
    await emit(
        "msg",
        {"type": "role_deleted", "payload": {"role_id": role_id}},
        room=rooms,
    )
    print("\u001b[34m[WebSocket]\u001b[0m Emitting role_deleted event to rooms:", rooms)
    return {"detail": "Role deleted"}


@router.get(
    "/{role_id}/permissions",
    response_model=list[PermissionRead],
    dependencies=[Depends(require_permission_or_superuser("role:read"))],
)
def read_role_permissions(role_id: int, db: Session = Depends(get_session)):
    role = db.exec(
        select(Role).where(Role.id == role_id).options(selectinload(Role.permissions))
    ).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role.permissions or []


@router.post(
    "/{role_id}/permissions/{permission_id}",
    response_model=dict,
    dependencies=[Depends(require_permission_or_superuser("role:update"))],
)
async def assign_permission_to_role(
    role_id: int,
    permission_id: int,
    db: Session = Depends(get_session),
):
    def _assign() -> tuple[RoleRead, PermissionRead, list[str]]:
        role = db.get(Role, role_id)
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        permission = db.get(Permission, permission_id)
        if not permission:
            raise HTTPException(status_code=404, detail="Permission not found")

        link_exists = db.exec(
            select(RolePermission).where(
                (RolePermission.role_id == role_id)
                & (RolePermission.permission_id == permission_id)
            )
        ).first()
        if link_exists:
            raise HTTPException(status_code=400, detail="Permission already assigned")

        db.add(RolePermission(role_id=role_id, permission_id=permission_id))
        db.commit()
        rooms = build_rooms_for_permission(db, "role:read") + [f"role_{role_id}"]
        print("\u001b[34m[WebSocket]\u001b[0m Emitting role_permission_added event to rooms:", rooms)
        return (
            RoleRead.model_validate(role),
            PermissionRead.model_validate(permission),
            rooms,
        )

    role_read, permission_read, rooms = await run_in_threadpool(_assign)
    await emit(
        "msg",
        {
            "type": "role_permission_added",
            "payload": {
                "role": role_read.model_dump(),
                "permission": permission_read.model_dump(),
            },
        },
        room=rooms,
    )
    return {"detail": "Permission assigned"}


@router.delete(
    "/{role_id}/permissions/{permission_id}",
    response_model=dict,
    dependencies=[Depends(require_permission_or_superuser("role:update"))],
)
async def remove_permission_from_role(
    role_id: int,
    permission_id: int,
    db: Session = Depends(get_session),
):
    def _remove() -> tuple[dict | None, list[str]]:
        link = db.exec(
            select(RolePermission).where(
                (RolePermission.role_id == role_id)
                & (RolePermission.permission_id == permission_id)
            )
        ).first()
        if not link:
            raise HTTPException(status_code=404, detail="Role permission not found")

        db.delete(link)
        db.commit()
        role = db.get(Role, role_id)
        permission = db.get(Permission, permission_id)
        rooms = build_rooms_for_permission(db, "role:read") + [f"role_{role_id}"]
        print("\u001b[34m[WebSocket]\u001b[0m Emitting role_permission_removed event to rooms:", rooms)
        payload = None
        if role and permission:
            payload = {
                "role": RoleRead.model_validate(role).model_dump(),
                "permission": PermissionRead.model_validate(permission).model_dump(),
            }
        return payload, rooms

    payload, rooms = await run_in_threadpool(_remove)
    if payload is not None:
        await emit(
            "msg",
            {"type": "role_permission_removed", "payload": payload},
            room=rooms,
        )
    return {"detail": "Permission removed"}
