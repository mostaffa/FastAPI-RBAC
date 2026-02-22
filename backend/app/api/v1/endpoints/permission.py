from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.user import Permission, Role
from app.models.permission import RolePermission
from app.schemas.permission import PermissionCreate, PermissionRead
from app.core.rbac import require_superuser
from app.core.security import get_current_user
from app.websockets.connection_manager import emit

router = APIRouter()


def get_superuser_role(db: Session) -> Role | None:
    return db.exec(select(Role).where(Role.name == "superuser")).first()


def build_role_rooms(superuser_role: Role | None) -> list[str]:
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
    # 1. Check if permission exists
    existing_permission = db.exec(select(Permission).where(Permission.name == permission_in.name)).first()
    if existing_permission:
        raise HTTPException(status_code=400, detail="Permission already exists")

    # 2. Map schema to model
    db_permission = Permission(name=permission_in.name)
    
    db.add(db_permission)
    db.commit()
    db.refresh(db_permission)

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

    await emit(
        "msg",
            {"type": "permission_created", "payload": PermissionRead.model_validate(db_permission).model_dump()},
            # {"type": "permission_created", "payload": db_permission.dict()},
            room=build_role_rooms(superuser_role),
    )
    return db_permission

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
async def update_permission(permission_id: int, permission_in: PermissionCreate, db: Session = Depends(get_session)):
    permission = db.get(Permission, permission_id)
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    # Check if new name conflicts with existing permission
    if permission.name != permission_in.name:
        existing_permission = db.exec(select(Permission).where(Permission.name == permission_in.name)).first()
        if existing_permission:
            raise HTTPException(status_code=400, detail="Permission name already exists")
    permission.name = permission_in.name
    db.add(permission)
    db.commit()
    db.refresh(permission)
    superuser_role = get_superuser_role(db)
    await emit(
        "msg",
        {"type": "permission_updated", "payload": PermissionRead.model_validate(permission).model_dump()},
        room=build_role_rooms(superuser_role),
    )
    return permission

@router.delete(
    "/{permission_id}",
    response_model=dict,
    dependencies=[Depends(require_superuser())],
)
async def delete_permission(permission_id: int, db: Session = Depends(get_session)):
    permission = db.get(Permission, permission_id)
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    db.delete(permission)
    db.commit()
    superuser_role = get_superuser_role(db)
    await emit(
        "msg",
        {"type": "permission_deleted", "payload": {"id": permission_id}},
        room=build_role_rooms(superuser_role),
    )
    return {"detail": "Permission deleted"}

