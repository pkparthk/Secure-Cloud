from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Any

from app.auth.permissions import admin_permission
from app.db.models import User, VM
from app.db.mongodb import db
from app.aws.sts import get_role_credentials
from app.aws.ec2 import list_instances, get_instance_by_id

router = APIRouter()

@router.get("/instances", response_model=List[VM])
async def get_instances(current_user: User = Depends(admin_permission)) -> Any:
    """
    Get list of all VM instances (Admin only)
    """
    try:
        # Get AWS credentials for admin role
        credentials = get_role_credentials("admin", current_user.id)
        
        # List instances using AWS credentials
        instances = list_instances(credentials)
        
        # Log the action
        await db.db.logs.insert_one({
            "user_id": current_user.id,
            "event_type": "list_instances",
            "details": {"role": "admin", "count": len(instances)}
        })
        
        return instances
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list instances: {str(e)}"
        )

@router.get("/instances/{instance_id}", response_model=VM)
async def get_instance(
    instance_id: str,
    current_user: User = Depends(admin_permission)
) -> Any:
    """
    Get details of a specific VM instance (Admin only)
    """
    try:
        # Get AWS credentials for admin role
        credentials = get_role_credentials("admin", current_user.id)
        
        # Get instance details
        instance = get_instance_by_id(credentials, instance_id)
        
        # Log the action
        await db.db.logs.insert_one({
            "user_id": current_user.id,
            "event_type": "get_instance",
            "details": {"role": "admin", "instance_id": instance_id}
        })
        
        return instance
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get instance: {str(e)}"
        )

@router.get("/users", response_model=List[User])
async def get_users(current_user: User = Depends(admin_permission)) -> Any:
    """
    Get list of all users (Admin only)
    """
    user_collection = db.db.users
    users = await user_collection.find().to_list(1000)
    
    # Convert _id to id for each user
    for user in users:
        user["id"] = str(user.pop("_id"))
    
    # Log the action
    await db.db.logs.insert_one({
        "user_id": current_user.id,
        "event_type": "list_users",
        "details": {"role": "admin", "count": len(users)}
    })
    
    return users