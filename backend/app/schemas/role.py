from pydantic import BaseModel

class RoleCreate(BaseModel):
    """
    Docstring for RoleCreate
    Schema for creating a new role.
    """
    name: str

class RoleRead(BaseModel):
    """
    Docstring for RoleRead
    Schema for reading role information.
    """
    id: int
    name: str

    class Config:
        from_attributes = True