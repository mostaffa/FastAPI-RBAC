from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


class RolePermission(SQLModel, table=True):
    role_id: Optional[int] = Field(
        default=None, foreign_key="role.id", primary_key=True
    )
    permission_id: Optional[int] = Field(
        default=None, foreign_key="permission.id", primary_key=True
    )

class Permission(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)

    roles: List["Role"] = Relationship( # type: ignore
        back_populates="permissions", link_model=RolePermission
    )