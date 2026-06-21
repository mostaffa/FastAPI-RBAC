# app/api/v1/endpoints/auth.py
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from app.core.permissions import permission_names_from_user
from app.core.security import verify_password, create_access_token, get_current_user
from app.db.session import get_session
from app.models.user import Role, User
from app.schemas.auth import TokenWithUser, UserOut
from app.schemas.user import UserRead


router = APIRouter()


@router.post("/login", response_model=TokenWithUser)
def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_session),
) -> TokenWithUser:
    # Load the user with the role graph eager-loaded so the permission list and
    # UserRead serialization need no further queries.
    user = db.exec(
        select(User)
        .where(User.username == form_data.username)
        .options(selectinload(User.role).selectinload(Role.permissions))
    ).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(subject=str(user.id))
    user_permissions = permission_names_from_user(user)
    response.set_cookie(key="access_token", value=f"Bearer {access_token}", httponly=True)
    return TokenWithUser(
        access_token=access_token,
        token_type="bearer",
        user=UserOut(user=UserRead.model_validate(user), permissions=user_permissions),
    )


# /api/v1/auth/me endpoint to get current user info
@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)) -> UserOut:
    # current_user arrives with role/permissions eager-loaded (see security.py).
    return UserOut(
        user=UserRead.model_validate(current_user),
        permissions=permission_names_from_user(current_user),
    )


# /api/v1/auth/logout endpoint to logout user
@router.post("/logout")
async def logout(response: Response, current_user: User = Depends(get_current_user)):
    response.delete_cookie(key="access_token")
    return {"message": "Successfully logged out"}
