"""Security utilities — password hashing, JWT tokens, auth dependencies."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from app.core.config import ACCESS_TOKEN_EXPIRE_MINUTES, ALGORITHM, SECRET_KEY
from app.db.session import get_session
from app.models.user import Role, User


# ---------------------------------------------------------------------------
# Password hashing (Argon2 — memory-hard, resistant to GPU attacks)
# ---------------------------------------------------------------------------

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

def create_access_token(
    subject: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return jwt.encode({"sub": subject, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


# ---------------------------------------------------------------------------
# Auth dependencies
# ---------------------------------------------------------------------------

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def _get_user_from_token(token: str, db: Session) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.exec(
        select(User)
        .where(User.id == int(user_id))
        .options(selectinload(User.role).selectinload(Role.permissions))
    ).first()
    if not user or not user.active:
        raise credentials_exception

    return user


def extract_bearer_from_cookie_value(raw: str | None) -> str:
    """Normalize cookie value to a bare JWT string."""
    if raw is None:
        raise JWTError("Missing token")
    v = raw.strip().strip('"').strip("'")
    if v.lower().startswith("bearer "):
        v = v.split(" ", 1)[1]
    if not v:
        raise JWTError("Empty token")
    return v


def get_current_user(
    request: Request,
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_session),
) -> User:
    if not token:
        cookie_token = request.cookies.get("access_token")
        if cookie_token:
            token = extract_bearer_from_cookie_value(cookie_token)
    if not token:
        raise credentials_exception
    return _get_user_from_token(token, db)


def get_current_user_from_token(token: str, db: Session) -> User | None:
    """Non-throwing variant for Socket.IO auth (returns None on failure)."""
    try:
        return _get_user_from_token(token, db)
    except HTTPException:
        return None
