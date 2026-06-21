from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from app.core.permissions import build_rooms_for_permission, permission_names_from_user
from app.core.rbac import require_permission, require_ownership_or_permission_or_superuser
from app.core.security import get_current_user, hash_password
from app.db.session import get_session
from app.models.user import Role, User
from app.schemas.user import UserCreate, UserRead
from app.websockets.connection_manager import emit

router = APIRouter()


@router.post(
    "/",
    response_model=UserRead,
    dependencies=[Depends(require_permission("user:create"))],
)
async def create_user(user_in: UserCreate, db: Session = Depends(get_session)):
    def _create() -> tuple[UserRead, list[str]]:
        existing_user = db.exec(select(User).where(User.email == user_in.email)).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists")

        db_user = User(
            username=user_in.username,
            email=user_in.email,
            hashed_password=hash_password(user_in.password),
            role_id=user_in.role_id,
            active=user_in.active,
            first_name=user_in.first_name,
            last_name=user_in.last_name,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        # Reload with the role eager-loaded so serialization never lazy-loads.
        db_user = db.exec(
            select(User).where(User.id == db_user.id).options(selectinload(User.role))
        ).first()
        return UserRead.model_validate(db_user), build_rooms_for_permission(db, "user:read")

    user_read, rooms = await run_in_threadpool(_create)
    await emit(
        "msg",
        {"type": "user_created", "payload": {"user": user_read.model_dump()}},
        room=rooms,
    )
    return user_read


@router.get(
    "/{user_id}",
    response_model=UserRead,
    dependencies=[Depends(require_permission("user:read"))],
)
def read_user(user_id: int, db: Session = Depends(get_session)):
    user = db.exec(
        select(User).where(User.id == user_id).options(selectinload(User.role))
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get(
    "/",
    response_model=list[UserRead],
    dependencies=[Depends(require_permission("user:read"))],
)
def read_users(skip: int = 0, limit: int = 10, db: Session = Depends(get_session)):
    statement = (
        select(User).offset(skip).limit(limit).options(selectinload(User.role))
    )
    users = db.exec(statement).all()
    return users


@router.delete(
    "/{user_id}",
    response_model=dict,
    dependencies=[Depends(require_permission("user:delete"))],
)
async def delete_user(user_id: int, db: Session = Depends(get_session)):
    def _delete() -> tuple[int, list[str]]:
        user = db.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        deleted_id = user.id
        db.delete(user)
        db.commit()
        return deleted_id, build_rooms_for_permission(db, "user:read")

    deleted_id, rooms = await run_in_threadpool(_delete)
    await emit(
        "msg",
        {"type": "user_deleted", "payload": {"user_id": deleted_id}},
        room=rooms,
    )
    return {"detail": "User deleted"}


@router.put(
    "/{user_id}",
    response_model=UserRead,
    dependencies=[
        Depends(require_ownership_or_permission_or_superuser("user_id", "user:update"))
    ],
)
async def update_user(
    user_id: int,
    user_in: UserRead,
    user_request: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    def _update() -> tuple[UserRead, list[str], list[str]]:
        user = db.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.username = user_in.username
        user.email = user_in.email
        user.active = user_in.active
        user.first_name = user_in.first_name
        user.last_name = user_in.last_name
        old_role_id = user.role_id
        # Only a user with "permission:update" (or the superuser) may change roles.
        if user_request.has_permission("permission:update") or user_request.role_id == 1:
            user.role_id = user_in.role.id if user_in.role else user.role_id

        db.add(user)
        db.commit()

        # Reload the full role graph once for serialization + permission names.
        user = db.exec(
            select(User)
            .where(User.id == user_id)
            .options(selectinload(User.role).selectinload(Role.permissions))
        ).first()
        user_read = UserRead.model_validate(user)
        permission_names = permission_names_from_user(user)

        rooms = build_rooms_for_permission(db, "user:read")
        if old_role_id:
            rooms.append(f"role_{old_role_id}")
        if user.role_id:
            rooms.append(f"role_{user.role_id}")
        return user_read, permission_names, rooms

    user_read, permission_names, rooms = await run_in_threadpool(_update)
    await emit(
        "msg",
        {
            "type": "user_updated",
            "payload": {"user": user_read.model_dump(), "permissions": permission_names},
        },
        room=rooms,
    )
    return user_read
