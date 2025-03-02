from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class Role(str, Enum):
    ADMIN = "admin"
    DEVELOPER = "developer"
    SOC = "soc"

class User(BaseModel):
    id: Optional[str] = None
    username: str
    email: str
    hashed_password: str
    role: Role
    mfa_enabled: bool = False
    mfa_secret: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserInDB(User):
    pass

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: Role

class UserUpdate(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[Role] = None
    mfa_enabled: Optional[bool] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    role: Role

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class MFASetup(BaseModel):
    secret: str
    qr_code_url: str

class MFAVerify(BaseModel):
    token: str

class LogEntry(BaseModel):
    id: Optional[str] = None
    user_id: str
    event_type: str
    details: dict
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source_ip: Optional[str] = None
    user_agent: Optional[str] = None

class VM(BaseModel):
    id: str
    name: str
    instance_type: str
    status: str
    public_ip: Optional[str] = None
    private_ip: Optional[str] = None
    environment: str
    tags: dict

class SSHSession(BaseModel):
    id: Optional[str] = None
    user_id: str
    vm_id: str
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    active: bool = True
    session_token: Optional[str] = None

class LogAnalysisResult(BaseModel):
    log_ids: List[str]
    severity: str
    anomaly_score: float
    description: str
    detected_at: datetime = Field(default_factory=datetime.utcnow)
    is_real_threat: Optional[bool] = None