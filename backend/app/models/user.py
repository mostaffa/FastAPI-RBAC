from typing import List, Optional
from app.models.permission import Permission
from sqlmodel import Field, Relationship, SQLModel
from app.models.permission import RolePermission 

class Role(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)  # e.g., "admin", "user"

    # Relationship back to Users
    users: List["User"] = Relationship(back_populates="role")
    permissions: List["Permission"] = Relationship(
        back_populates="roles", link_model=RolePermission
    )

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: str = Field(unique=True)
    first_name: Optional[str] = Field(default=None)
    last_name: Optional[str] = Field(default=None)
    active: bool = Field(default=True)
    hashed_password: str
    
    # Foreign Key
    role_id: Optional[int] = Field(default=None, foreign_key="role.id")
    
    # Relationship object
    role: Optional[Role] = Relationship(back_populates="users")

    def has_permission(self, permission_name: str) -> bool:
        if not self.role:
            return False
        return any(p.name == permission_name for p in self.role.permissions)