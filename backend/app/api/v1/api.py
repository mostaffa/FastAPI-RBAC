from fastapi import APIRouter
from app.api.v1.endpoints import users, rols, auth, permission, system


api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(rols.router, prefix="/roles", tags=["roles"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(permission.router, prefix="/permissions", tags=["permissions"])
api_router.include_router(system.router, prefix="/system", tags=["system"])