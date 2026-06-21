from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from sqlmodel import Session, select

from app.core.rbac import require_superuser
from app.core.security import get_current_user
from app.db.session import get_session
from app.models.permission import RolePermission
from app.models.user import Permission, Role
from app.schemas.permission import PermissionCreate, PermissionRead
from app.websockets.connection_manager import emit

router = APIRouter()


def get_superuser_role(db: Session) -> Role | None:
    return db.exec(select(Role).where(Role.name == "superuser")).first()


def build_superuser_rooms(superuser_role: Role | None) -> list[str]:
    rooms = ["role_1"]
    if superuser_role:
        rooms.append(f"role_{superuser_role.id}")
    return rooms


@router.post(
    "/",
    response_model=PermissionRead,
    dependencies=[Depends(require_superuser())],
)
async def create_permission(permission_in: PermissionCreate, db: Session = Depends(get_session)):
    def _create() -> tuple[PermissionRead, list[str]]:
        existing_permission = db.exec(
            select(Permission).where(Permission.name == permission_in.name)
        ).first()
        if existing_permission:
            raise HTTPException(status_code=400, detail="Permission already exists")

        db_permission = Permission(name=permission_in.name)
        db.add(db_permission)
        db.commit()
        db.refresh(db_permission)

        # Always grant new permissions to the superuser role.
        superuser_role = get_superuser_role(db)
        if superuser_role:
            link_exists = db.exec(
                select(RolePermission).where(
                    (RolePermission.role_id == superuser_role.id)
                    & (RolePermission.permission_id == db_permission.id)
                )
            ).first()
            if not link_exists:
                db.add(
                    RolePermission(
                        role_id=superuser_role.id,
                        permission_id=db_permission.id,
                    )
                )
                db.commit()

        return PermissionRead.model_validate(db_permission), build_superuser_rooms(superuser_role)

    permission_read, rooms = await run_in_threadpool(_create)
    await emit(
        "msg",
        {"type": "permission_created", "payload": permission_read.model_dump()},
        room=rooms,
    )
    return permission_read


@router.get(
    "/{permission_id}",
    response_model=PermissionRead,
    dependencies=[Depends(get_current_user)],
)
def read_permission(permission_id: int, db: Session = Depends(get_session)):
    permission = db.get(Permission, permission_id)
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    return permission


@router.get(
    "/",
    response_model=list[PermissionRead],
    dependencies=[Depends(get_current_user)],
)
def read_permissions(db: Session = Depends(get_session)):
    permissions = db.exec(select(Permission)).all()
    return permissions


@router.put(
    "/{permission_id}",
    response_model=PermissionRead,
    dependencies=[Depends(require_superuser())],
)
async def update_permission(
    permission_id: int,
    permission_in: PermissionCreate,
    db: Session = Depends(get_session),
):
    def _update() -> tuple[PermissionRead, list[str]]:
        permission = db.get(Permission, permission_id)
        if not permission:
            raise HTTPException(status_code=404, detail="Permission not found")
        # Check if new name conflicts with existing permission
        if permission.name != permission_in.name:
            existing_permission = db.exec(
                select(Permission).where(Permission.name == permission_in.name)
            ).first()
            if existing_permission:
                raise HTTPException(status_code=400, detail="Permission name already exists")
        permission.name = permission_in.name
        db.add(permission)
        db.commit()
        db.refresh(permission)
        return PermissionRead.model_validate(permission), build_superuser_rooms(
            get_superuser_role(db)
        )

    permission_read, rooms = await run_in_threadpool(_update)
    await emit(
        "msg",
        {"type": "permission_updated", "payload": permission_read.model_dump()},
        room=rooms,
    )
    return permission_read


@router.delete(
    "/{permission_id}",
    response_model=dict,
    dependencies=[Depends(require_superuser())],
)
async def delete_permission(permission_id: int, db: Session = Depends(get_session)):
    def _delete() -> list[str]:
        permission = db.get(Permission, permission_id)
        if not permission:
            raise HTTPException(status_code=404, detail="Permission not found")
        db.delete(permission)
        db.commit()
        return build_superuser_rooms(get_superuser_role(db))

    rooms = await run_in_threadpool(_delete)
    await emit(
        "msg",
        {"type": "permission_deleted", "payload": {"id": permission_id}},
        room=rooms,
    )
    return {"detail": "Permission deleted"}
