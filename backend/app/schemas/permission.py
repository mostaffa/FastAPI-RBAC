from pydantic import BaseModel

class PermissionCreate(BaseModel):
    """
    Docstring for PermissionCreate
    Schema for creating a new permission.
    """
    name: str
class PermissionRead(BaseModel):
    """
    Docstring for PermissionRead
    Schema for reading permission information.
    """
    id: int
    name: str

    class Config:
        from_attributes = True

        
