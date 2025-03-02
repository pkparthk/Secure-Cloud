from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from typing import Any

from app.core.config import settings
from app.core.security import create_access_token, verify_password, get_password_hash
from app.auth.mfa import generate_totp_secret, get_totp_uri, generate_qr_code, verify_totp
from app.db.models import User, Token, UserCreate, MFASetup, MFAVerify
from app.db.mongodb import db
from app.auth.jwt_handler import get_current_user

router = APIRouter()

@router.post("/register", response_model=User)
async def register_user(user_data: UserCreate) -> Any:
    """
    Register a new user with username, email, password, and role
    """
    user_collection = db.db.users
    
    # Check if username already exists
    if await user_collection.find_one({"username": user_data.username}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Check if email already exists
    if await user_collection.find_one({"email": user_data.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    # Create new user
    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        role=user_data.role,
        mfa_enabled=False
    )
    
    # Insert user to database
    result = await user_collection.insert_one(user.dict(exclude={"id"}))
    user.id = str(result.inserted_id)
    
    # Log user creation
    await db.db.logs.insert_one({
        "user_id": user.id,
        "event_type": "user_created",
        "details": {"username": user.username, "role": user.role}
    })
    
    return user

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()) -> Any:
    """
    Get an access token for future requests
    """
    user_collection = db.db.users
    user = await user_collection.find_one({"username": form_data.username})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if MFA is enabled for user
    if user.get("mfa_enabled", False):
        # MFA is enabled, but this is just the first step
        # Client should redirect to MFA verification
        return {
            "access_token": "mfa_required",
            "token_type": "bearer",
            "role": user["role"]
        }
    
    # Create access token if MFA is not enabled
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=str(user["_id"]), expires_delta=access_token_expires
    )
    
    # Log successful login
    await db.db.logs.insert_one({
        "user_id": str(user["_id"]),
        "event_type": "user_login",
        "details": {"username": user["username"], "mfa_used": False}
    })
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user["role"]
    }

@router.post("/verify-mfa", response_model=Token)
async def verify_mfa(
    username: str,
    verification: MFAVerify
) -> Any:
    """
    Verify MFA token and get access token
    """
    user_collection = db.db.users
    user = await user_collection.find_one({"username": username})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.get("mfa_enabled", False) or not user.get("mfa_secret"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA not enabled for this user",
        )
    
    # Verify the TOTP token
    if not verify_totp(user["mfa_secret"], verification.token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid MFA token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=str(user["_id"]), expires_delta=access_token_expires
    )
    
    # Log successful MFA verification
    await db.db.logs.insert_one({
        "user_id": str(user["_id"]),
        "event_type": "user_login",
        "details": {"username": user["username"], "mfa_used": True}
    })
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user["role"]
    }

@router.post("/setup-mfa", response_model=MFASetup)
async def setup_mfa(current_user: User = Depends(get_current_user)) -> Any:
    """
    Setup MFA for the current user
    """
    user_collection = db.db.users
    
    # Generate a new TOTP secret
    secret = generate_totp_secret()
    
    # Generate the TOTP URI
    totp_uri = get_totp_uri(current_user.username, secret)
    
    # Generate QR code
    qr_code = generate_qr_code(totp_uri)
    
    # Update user in database with the secret (but don't enable MFA yet)
    await user_collection.update_one(
        {"_id": current_user.id},
        {"$set": {"mfa_secret": secret}}
    )
    
    return {
        "secret": secret,
        "qr_code_url": qr_code
    }

@router.post("/enable-mfa", response_model=bool)
async def enable_mfa(
    verification: MFAVerify,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Enable MFA after verifying token
    """
    user_collection = db.db.users
    user = await user_collection.find_one({"_id": current_user.id})
    
    if not user.get("mfa_secret"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA setup required first",
        )
    
    # Verify the TOTP token
    if not verify_totp(user["mfa_secret"], verification.token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid MFA token",
        )
    
    # Enable MFA for the user
    await user_collection.update_one(
        {"_id": current_user.id},
        {"$set": {"mfa_enabled": True}}
    )
    
    # Log MFA enablement
    await db.db.logs.insert_one({
        "user_id": current_user.id,
        "event_type": "mfa_enabled",
        "details": {"username": current_user.username}
    })
    
    return True