from datetime import datetime, timedelta, timezone
from typing import Optional
import os
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlmodel import Session, select

from app.db.session import get_session
from app.models.user import User
from app.models.permission import Permission, RolePermission

# load environment variables from .env file
env_path = os.path.join(os.path.dirname(__file__), "../../../.env")
load_dotenv(dotenv_path=env_path)

# -------------------------------------------------------------------
# Config (move to env later)
# -------------------------------------------------------------------

SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE_ME_SUPER_SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 100000000))

# -------------------------------------------------------------------
# Security utils
# -------------------------------------------------------------------

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

# -------------------------------------------------------------------
# Password helpers
# -------------------------------------------------------------------

def hash_password(password: str) -> str:
    # argon2 doesn't have the 72-byte limitation that bcrypt has
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# -------------------------------------------------------------------
# JWT helpers
# -------------------------------------------------------------------

def create_access_token(
    subject: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta
        if expires_delta
        else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    to_encode: dict[str, str | datetime] = {
        "sub": subject,
        "exp": expire,
    }

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# -------------------------------------------------------------------
# Auth dependencies
# -------------------------------------------------------------------

def get_current_user(
    request: Request,
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_session),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        cookie_token = request.cookies.get("access_token")
        if cookie_token:
            token = extract_bearer_from_cookie_value(cookie_token)

    print(f"\u001b[34mReceived token: {token}\u001b[0m")
    if not token:
        raise credentials_exception

    return _get_user_from_token(token, db, credentials_exception)

def get_current_user_from_token(token: str, db: Session) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    return _get_user_from_token(token, db, credentials_exception)

def _get_user_from_token(token: str, db: Session, credentials_exception: HTTPException) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.exec(
        select(User).where(User.id == int(user_id))
    ).first()

    if not user or not user.active:
        raise credentials_exception

    return user

def extract_bearer_from_cookie_value(raw: str | None) -> str:
    """Normalize cookie value to a bare JWT string. Accepts optional surrounding quotes and 'Bearer ' prefix."""
    if raw is None:
        raise JWTError("Missing token")
    v = raw.strip().strip('"').strip("'")
    if v.lower().startswith("bearer "):
        v = v.split(" ", 1)[1]
    if not v:
        raise JWTError("Empty token")
    return v

def get_current_user_permissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
) -> list[Permission]:
    if not current_user.role:
        return []
    # return a list of permissions from RolePermission objects related to the user's role
    permissions = db.exec(
        select(Permission).join(RolePermission).where(RolePermission.role_id == current_user.role_id)
    ).all()
    return list(permissions)