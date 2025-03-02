from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any

from app.auth.jwt_handler import get_current_user
from app.db.models import User
from app.db.mongodb import db

router = APIRouter()

@router.get("/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)) -> Any:
    """
    Get current user info
    """
    return current_user

@router.get("/health", response_model=dict)
async def health_check() -> Any:
    """
    Health check endpoint
    """
    return {"status": "ok", "message": "Service is running"}