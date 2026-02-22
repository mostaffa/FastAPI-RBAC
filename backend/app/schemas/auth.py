# app/schemas/auth.py
from app.schemas.user import UserRead
from pydantic import BaseModel

class TokenWithUser(BaseModel):
    access_token: str
    token_type: str
    user: "UserOut"

class TokenData(BaseModel):
    user_id: int | None = None  
class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    user: UserRead
    permissions: list[str] = []
    class Config:
        from_attributes = True
