from pydantic import BaseModel, EmailStr
from typing import Optional
from app.schemas.role import RoleRead

class UserCreate(BaseModel):
    """
    Docstring for UserCreate
    Schema for creating a new user.
    """
    username: str
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: str
    active: bool = True
    role_id: Optional[int] = None

class UserRead(BaseModel):
    """
    Docstring for UserRead
    Schema for reading user information.
    """
    id: int
    username: str
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    active: bool
    role: Optional[RoleRead] = None

    class Config:
        from_attributes = True