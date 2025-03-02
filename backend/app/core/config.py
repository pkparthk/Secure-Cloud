from dotenv import load_dotenv
import os
from pydantic_settings import BaseSettings

# Load environment variables
load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Secure Cloud Access System"
    API_V1_STR: str = "/api/v1"

    # JWT Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    if not SECRET_KEY:
        raise ValueError("❌ SECRET_KEY is missing in environment variables!")

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # MongoDB Settings
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "secure_cloud_access")

    # AWS Settings
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    
    # Ensure AWS credentials are provided if not using IAM role
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", None)
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", None)

    # Ensure both AWS keys are either provided or omitted (to use IAM role)
    if (AWS_ACCESS_KEY_ID and not AWS_SECRET_ACCESS_KEY) or (AWS_SECRET_ACCESS_KEY and not AWS_ACCESS_KEY_ID):
        raise ValueError("❌ Both AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set together!")

    # TOTP Settings (for MFA)
    TOTP_ISSUER: str = "SecureCloudAccess"
    TOTP_DIGITS: int = 6
    TOTP_INTERVAL: int = 30

    # Role ARNs (must be set correctly)
    ADMIN_ROLE_ARN: str = os.getenv("ADMIN_ROLE_ARN")
    DEVELOPER_ROLE_ARN: str = os.getenv("DEVELOPER_ROLE_ARN")
    SOC_ROLE_ARN: str = os.getenv("SOC_ROLE_ARN")

    if not all([ADMIN_ROLE_ARN, DEVELOPER_ROLE_ARN, SOC_ROLE_ARN]):
        raise ValueError("❌ One or more AWS IAM Role ARNs are missing in the environment variables!")

    # SSH Gateway Settings
    SSH_HOST: str = os.getenv("SSH_HOST", "localhost")
    SSH_PORT: int = int(os.getenv("SSH_PORT", "22"))

    class Config:
        case_sensitive = True

settings = Settings()
