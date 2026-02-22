from app.models.permission import Permission
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.user import User
from app.models.permission import RolePermission
from app.schemas.user import UserCreate, UserRead
from app.core.rbac import require_permission, require_ownership_or_permission_or_superuser
from app.core.security import get_current_user, hash_password
from app.websockets.connection_manager import emit

router = APIRouter()

# Helper function to return an array of roomes for all users with "user:read" permission (including superusers)
def build_user_read_rooms(db: Session) -> list[str]:
    # Get all roles with "user:read" permission from RolePermission
    # First, find the permission with name "user:read"
    permission = db.exec(select(Permission).where(Permission.name == "user:read")).first()
    if not permission:
        return []
    
    # Get all role_ids with this permission
    role_permissions = db.exec(select(RolePermission).where(RolePermission.permission_id == permission.id)).all()
    role_ids = [rp.role_id for rp in role_permissions]
    
    return [f"role_{role_id}" for role_id in role_ids] 

@router.post("/",
            response_model=UserRead,
            dependencies=[Depends(require_permission("user:create"))]
            )
async def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_session)):
    # 1. Check if user exists
    existing_user = db.exec(select(User).where(User.email == user_in.email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    # 2. Map schema to model and hash password
    db_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        role_id=user_in.role_id,
        active=user_in.active,
        first_name=user_in.first_name,
        last_name=user_in.last_name
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    await emit(
        "msg",
        {
            "type": "user_created",
            "payload": {"user": UserRead.model_validate(db_user).model_dump()},
        },
        room=build_user_read_rooms(db),
    )
    return db_user

@router.get("/{user_id}",
             response_model=UserRead,
             dependencies=[Depends(require_permission("user:read"))]
             )
def read_user(user_id: int, db: Session = Depends(get_session)):
    statement = select(User).where(User.id == user_id)
    user = db.exec(statement).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/",
            response_model=list[UserRead],
            dependencies=[Depends(require_permission("user:read"))]
            )
def read_users(skip: int = 0, limit: int = 10, db: Session = Depends(get_session)):
    statement = select(User).offset(skip).limit(limit)
    users = db.exec(statement).all()
    return users

@router.delete("/{user_id}", response_model=dict,
               dependencies=[Depends(require_permission("user:delete"))]
               )
async def delete_user(user_id: int, db: Session = Depends(get_session)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    await emit(
        "msg",
        {
            "type": "user_deleted",
            "payload": {"user_id": user.id},
        },
        room=build_user_read_rooms(db),
    )
    return {"detail": "User deleted"}

@router.put("/{user_id}", response_model=UserRead,
            dependencies=[Depends(require_ownership_or_permission_or_superuser("user_id","user:update"))]
            )
async def update_user(user_id: int, user_in: UserRead, user_request: User = Depends(get_current_user), db: Session = Depends(get_session)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.username = user_in.username
    user.email = user_in.email
    user.active = user_in.active
    user.first_name = user_in.first_name
    user.last_name = user_in.last_name
    old_role_id = user.role_id
    # if the user has'nt permission "permission:update" he cannot change his role, but if he has the permission or is superuser he can change his role
    if user_request.has_permission("permission:update") or user_request.role_id == 1:
        user.role_id = user_in.role.id if user_in.role else user.role_id
    # user.role_id = user_in.role.id if user_in.role else None

    db.add(user)
    db.commit()
    db.refresh(user)
    # notify all users with "user:read" permission about the update, including those who had access to the old role and those who have access to the new role
    # user as UserOut to avoid circular reference issues when serializing the user object for the websocket payload
    new_permissions = db.exec(
            select(Permission).join(RolePermission).where(RolePermission.role_id == user.role_id)
        ).all()
        
    await emit(
        "msg",
        {
            "type": "user_updated",
            "payload": {"user": UserRead.model_validate(user).model_dump(), "permissions": [perm.name for perm in new_permissions]},
        },
        room=build_user_read_rooms(db) + ([f"role_{old_role_id}"] if old_role_id else []) + ([f"role_{user.role_id}"] if user.role_id else []),
    )
    return user

