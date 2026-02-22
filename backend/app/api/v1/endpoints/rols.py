from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.user import Role, Permission
from app.models.permission import RolePermission
from app.schemas.role import RoleCreate, RoleRead
from app.schemas.permission import PermissionRead
from app.core.rbac import require_permission_or_superuser
from app.websockets.connection_manager import emit

router = APIRouter()

# 

# def build_role_rooms(role_id: int) -> list[str]:
#     return [f"role_{role_id}", "role_1"]

# Helper function to return an array of roomes for all users with "role:read" permission (including superusers)
def build_role_rooms(db: Session) -> list[str]:
    # Get all roles with "role:read" permission from RolePermission
    # First, find the permission with name "role:read"
    permission = db.exec(select(Permission).where(Permission.name == "role:read")).first()
    if not permission:
        return []
    
    # Get all role_ids with this permission
    role_permissions = db.exec(select(RolePermission).where(RolePermission.permission_id == permission.id)).all()
    role_ids = [rp.role_id for rp in role_permissions]
    
    return [f"role_{role_id}" for role_id in role_ids] 


@router.post(
    "/",
    response_model=RoleRead,
    dependencies=[Depends(require_permission_or_superuser("role:create"))],
)
async def create_role(role_in: RoleCreate, db: Session = Depends(get_session)):
    # 1. Check if role exists
    existing_role = db.exec(select(Role).where(Role.name == role_in.name)).first()
    if existing_role:
        raise HTTPException(status_code=400, detail="Role already exists")

    # 2. Map schema to model
    db_role = Role(name=role_in.name)
    
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    await emit(
        "msg",
        # {"type": "role_created", "payload": db_role.dict()},
        {"type": "role_created", "payload": RoleRead.model_validate(db_role).model_dump()},
        room=build_role_rooms(db),
    )
    return db_role

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
    await emit(
        "msg",
        {"type": "role_updated", "payload": RoleRead.model_validate(role).model_dump()},
        room=build_role_rooms(db),
    )
    return role

@router.delete(
    "/{role_id}",
    response_model=dict,
    dependencies=[Depends(require_permission_or_superuser("role:delete"))],
)
async def delete_role(role_id: int, db: Session = Depends(get_session)):
    # if role_id == 1 prevent deletion of superuser role
    if role_id == 1:
        raise HTTPException(status_code=400, detail="Cannot delete superuser role")
    role = db.get(Role, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    db.delete(role)
    db.commit()
    await emit(
        "msg",
        {"type": "role_deleted", "payload": {"role": RoleRead.model_validate(role).model_dump()}},
        room=build_role_rooms(db),
    )
    return {"detail": "Role deleted"}


@router.get(
    "/{role_id}/permissions",
    response_model=list[PermissionRead],
    dependencies=[Depends(require_permission_or_superuser("role:read"))],
)
def read_role_permissions(role_id: int, db: Session = Depends(get_session)):
    role = db.get(Role, role_id)
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
    
    # Refresh to get updated relationships
    db.refresh(role)
    db.refresh(permission)

    await emit(
        "msg",
        {
            "type": "role_permission_added",
            "payload": {"role": RoleRead.model_validate(role).model_dump(), "permission": PermissionRead.model_validate(permission).model_dump()},
            # "payload": {"role": role.dict(), "permission": permission.dict()},
        },
        room=build_role_rooms(db),
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
    link = db.exec(
        select(RolePermission).where(
            (RolePermission.role_id == role_id)
            & (RolePermission.permission_id == permission_id)
        )
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Role permission not found")

    old_role = db.get(Role, role_id)
    db.delete(link)
    db.commit()
    role = db.get(Role, role_id)
    permission = db.get(Permission, permission_id)
    if old_role and role and permission:
        await emit(
            "msg",
            {
                "type": "role_permission_removed",
                "payload": {"role": RoleRead.model_validate(role).model_dump(), "permission": PermissionRead.model_validate(permission).model_dump()},
            },
            room=build_role_rooms(db) + [f"role_{old_role.id}"],
        )
    return {"detail": "Permission removed"}