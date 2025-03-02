from fastapi import Depends, HTTPException, Security
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from datetime import datetime, timedelta
from app.core.config import settings
from app.db.mongodb import get_database
from pymongo.database import Database

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

# JWT Token Validation
def verify_token(token: str = Depends(oauth2_scheme)) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        exp = payload.get("exp")
        if exp and datetime.utcnow() > datetime.utcfromtimestamp(exp):
            raise HTTPException(status_code=401, detail="Token expired")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

# Dependency to get the current user
def get_current_user(token_data: dict = Depends(verify_token)) -> dict:
    user = {
        "id": token_data.get("sub"),
        "role": token_data.get("role"),
        "email": token_data.get("email")
    }
    if not user["id"]:
        raise HTTPException(status_code=401, detail="User authentication failed")
    return user

# Dependency for role-based access
def check_role(required_role: str):
    def role_checker(user: dict = Security(get_current_user)):
        if user["role"] != required_role:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

# Get database dependency
def get_db() -> Database:
    return get_database()
