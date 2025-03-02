from fastapi import Depends, HTTPException, status
from typing import List

from app.db.models import User, Role
from app.auth.jwt_handler import get_current_user

def check_roles(required_roles: List[Role]):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {', '.join([r.value for r in required_roles])}",
            )
        return current_user
    return role_checker

# Role-specific dependency functions
admin_permission = check_roles([Role.ADMIN])
developer_permission = check_roles([Role.DEVELOPER])
soc_permission = check_roles([Role.SOC])
admin_or_soc_permission = check_roles([Role.ADMIN, Role.SOC])