from fastapi import Depends, HTTPException, Request
from app.models.user import User
from app.core.security import get_current_user

def require_permission(permission: str):
    """
    Requires the user to have a specific permission.
    """
    def checker(user: User = Depends(get_current_user)):
        role = user.role
        if not role:
            raise HTTPException(status_code=403, detail="No role assigned")

        if not user.has_permission(permission):
            raise HTTPException(status_code=403, detail="Permission denied")

        return True
    return checker


def require_superuser():
    """
    Requires the user to be a superuser.
    """
    def checker(user: User = Depends(get_current_user)):
        role = user.role
        if not role or role.id != 1:
            raise HTTPException(
                status_code=403,
                detail="Superuser role required",
            )
        return True
    return checker


def require_permission_or_superuser(permission: str):
    """
    Requires the user to have a specific permission or be a superuser.
    """
    def checker(user: User = Depends(get_current_user)):
        role = user.role
        if not role:
            raise HTTPException(status_code=403, detail="No role assigned")
        
        # Check if superuser
        if role.id == 1:
            return True
        
        # Check if has permission
        if not user.has_permission(permission):
            raise HTTPException(status_code=403, detail="Permission denied")
        
        return True
    return checker

def require_ownership_or_permission_or_superuser(resource_user_id_field: str, permission: str):
    """
    Requires the user to be the owner of a resource, have a specific permission, or be a superuser.
    """
    def checker(request: Request, user: User = Depends(get_current_user)):
        role = user.role
        if not role:
            raise HTTPException(status_code=403, detail="No role assigned")
        
        # Check if superuser
        if role.id == 1:
            return True
        
        # Check if has permission
        if user.has_permission(permission):
            return True
        
        # Check ownership
        resource_user_id_raw = request.path_params.get(resource_user_id_field)
        if resource_user_id_raw is None:
            raise HTTPException(status_code=403, detail="Permission denied")
        try:
            resource_user_id = int(resource_user_id_raw)
        except (TypeError, ValueError):
            raise HTTPException(status_code=403, detail="Permission denied")

        if resource_user_id != user.id:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        return True
    return checker

