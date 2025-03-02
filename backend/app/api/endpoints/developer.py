from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from typing import List, Any

from app.auth.permissions import developer_permission
from app.db.models import User, VM, SSHSession
from app.db.mongodb import db
from app.aws.sts import get_role_credentials
from app.aws.ec2 import list_instances, get_instance_by_id
from app.ssh.gateway import create_ssh_session, handle_ssh_websocket, end_ssh_session

router = APIRouter()

@router.get("/dev-instances", response_model=List[VM])
async def get_dev_instances(current_user: User = Depends(developer_permission)) -> Any:
    """
    Get list of development VM instances (Developer only)
    """
    try:
        # Get AWS credentials for developer role
        credentials = get_role_credentials("developer", current_user.id)
        
        # List instances using AWS credentials
        all_instances = list_instances(credentials)
        
        # Filter for development instances only
        dev_instances = [
            instance for instance in all_instances 
            if instance.environment.lower() in ["dev", "development", "test"]
        ]
        
        # Log the action
        await db.db.logs.insert_one({
            "user_id": current_user.id,
            "event_type": "list_dev_instances",
            "details": {"role": "developer", "count": len(dev_instances)}
        })
        
        return dev_instances
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list development instances: {str(e)}"
        )

@router.post("/ssh-session/{instance_id}", response_model=dict)
async def create_new_ssh_session(
    instance_id: str,
    current_user: User = Depends(developer_permission)
) -> Any:
    """
    Create a new SSH session to a development VM (Developer only)
    """
    try:
        # Get AWS credentials for developer role
        credentials = get_role_credentials("developer", current_user.id)
        
        # Get instance details
        instance = get_instance_by_id(credentials, instance_id)
        
        # Check if instance is a development instance
        if instance.environment.lower() not in ["dev", "development", "test"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access to this instance is not allowed"
            )
        
        # Check if instance has a public or private IP
        vm_ip = instance.public_ip if instance.public_ip else instance.private_ip
        if not vm_ip:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Instance does not have a valid IP address for SSH connection"
            )
        
        # Create SSH session
        session_token = await create_ssh_session(current_user.id, instance_id, vm_ip, credentials)
        
        # Log the action
        await db.db.logs.insert_one({
            "user_id": current_user.id,
            "event_type": "ssh_session_created",
            "details": {
                "role": "developer", 
                "instance_id": instance_id,
                "session_token": session_token
            }
        })
        
        return {"session_token": session_token}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create SSH session: {str(e)}"
        )

@router.websocket("/ssh-ws/{session_token}")
async def ssh_websocket(websocket: WebSocket, session_token: str):
    """
    WebSocket endpoint for SSH session
    """
    await websocket.accept()
    
    try:
        await handle_ssh_websocket(websocket, session_token)
    except WebSocketDisconnect:
        await end_ssh_session(session_token)
    except Exception as e:
        await websocket.send_json({"error": f"SSH session error: {str(e)}"})
        await end_ssh_session(session_token)

@router.post("/ssh-session/{session_token}/close")
async def close_ssh_session(
    session_token: str,
    current_user: User = Depends(developer_permission)
) -> Any:
    """
    Close an SSH session (Developer only)
    """
    # Verify that the session belongs to the current user
    session_collection = db.db.ssh_sessions
    session = await session_collection.find_one({
        "session_token": session_token,
        "user_id": current_user.id
    })
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SSH session not found or not authorized"
        )
    
    # End the session
    success = await end_ssh_session(session_token)
    
    if success:
        # Log the action
        await db.db.logs.insert_one({
            "user_id": current_user.id,
            "event_type": "ssh_session_closed",
            "details": {
                "role": "developer", 
                "session_token": session_token
            }
        })
        
        return {"success": True}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to close SSH session"
        )