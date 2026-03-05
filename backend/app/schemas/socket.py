from pydantic import BaseModel, Field
from typing import Union, List

class SocketMessage(BaseModel):
    type: Literal[
        "notification", "error", 
        "user_created", "user_updated", "user_deleted",
        "role_created", "role_updated", "role_deleted",
        "role_permission_added", "role_permission_removed"
    ]
    
    payload: Union[
        UserRead, 
        RoleRead, 
        PermissionRead, 
        RolePermissionPayload,
        IdPayload,
        MessagePayload,
        str, 
        int
    ] = Field(..., description="The data associated with the event type")

    model_config = {
        "json_schema_extra": {
            "example": {
                "type": "user_created",
                "payload": {"id": 1, "email": "admin@example.com"}
            }
        }
    }