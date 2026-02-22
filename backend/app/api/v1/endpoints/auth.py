# app/api/v1/endpoints/auth.py
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select  # pyright: ignore[reportUnknownVariableType]
from app.db.session import get_session
from app.models.user import User
from app.models.permission import Permission, RolePermission
from app.schemas.auth import TokenWithUser, UserOut
from app.schemas.user import UserRead
from app.core.security import verify_password, create_access_token, get_current_user


router = APIRouter()

@router.post("/login", response_model=TokenWithUser)
def login(response: Response,form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_session)) -> TokenWithUser:
    # 1. Retrieve user by username
    user = db.exec(select(User).where(User.username == form_data.username)).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 2. Verify password
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 3. Create access token
    access_token = create_access_token(subject=str(user.id))
    # return token with userout
    # return Token(access_token=access_token, token_type="bearer")
    # set header with token and return user info
    # response.headers["Authorization"] = f"Bearer {access_token}"
    permissions = db.exec(
        select(Permission).join(RolePermission).where(RolePermission.role_id == user.role_id)
    ).all()
    user_permissions = [perm.name for perm in permissions]
    response.set_cookie(key="access_token",value=f"Bearer {access_token}", httponly=True)
    return TokenWithUser(access_token=access_token, token_type="bearer", user=UserOut(user=UserRead.model_validate(user), permissions=user_permissions))
    

# /api/v1/auth/me endpoint to get current user info
@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user), db: Session = Depends(get_session)) -> UserOut:
    role_permissions = []
    if current_user.role_id:
        # Query permissions from RolePermission table based on user's role_id
        permissions = db.exec(
            select(Permission).join(RolePermission).where(RolePermission.role_id == current_user.role_id)
        ).all()
        role_permissions = [perm.name for perm in permissions]
    return UserOut(user=UserRead.model_validate(current_user), permissions=role_permissions)

# /api/v1/auth/logout endpoint to logout user
@router.post("/logout")
async def logout(response: Response, current_user: User = Depends(get_current_user)):
    # disconnect user from all websocket rooms
    # await disconnect_user(current_user.id)
    response.delete_cookie(key="access_token")
    return {"message": "Successfully logged out"}