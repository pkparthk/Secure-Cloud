import boto3
import logging
from typing import Dict, Any
from app.core.config import settings

# Initialize logging
logger = logging.getLogger(__name__)

def get_sts_client():
    """Returns an STS client. Uses IAM role if running on AWS."""
    return boto3.client(
        "sts",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID if settings.AWS_ACCESS_KEY_ID else None,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY if settings.AWS_SECRET_ACCESS_KEY else None
    )

def assume_role(role_arn: str, session_name: str) -> Dict[str, Any]:
    """Assume an AWS IAM role and return temporary credentials."""
    sts_client = get_sts_client()

    try:
        response = sts_client.assume_role(
            RoleArn=role_arn,
            RoleSessionName=session_name,
            DurationSeconds=3600
        )

        return {
            "aws_access_key_id": response["Credentials"]["AccessKeyId"],
            "aws_secret_access_key": response["Credentials"]["SecretAccessKey"],
            "aws_session_token": response["Credentials"]["SessionToken"],
            "expiration": response["Credentials"]["Expiration"]
        }
    
    except Exception as e:
        logger.error(f"Error assuming role {role_arn}: {str(e)}")
        raise RuntimeError(f"Failed to assume role: {str(e)}")

def get_role_credentials(role: str, user_id: str) -> Dict[str, Any]:
    """Returns AWS credentials for a given role (admin, developer, soc)."""
    
    role_arn_map = {
        "admin": settings.ADMIN_ROLE_ARN,
        "developer": settings.DEVELOPER_ROLE_ARN,
        "soc": settings.SOC_ROLE_ARN
    }
    
    if role not in role_arn_map:
        raise ValueError(f"Invalid role: {role}")

    return assume_role(role_arn_map[role], f"{role}-session-{user_id}")
