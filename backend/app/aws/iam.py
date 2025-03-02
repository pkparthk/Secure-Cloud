import boto3
import json
from botocore.exceptions import BotoCoreError, NoCredentialsError, ClientError
from fastapi import HTTPException
from app.core.config import settings

# Initialize IAM Client
iam_client = boto3.client(
    "iam",
    aws_access_key_id=settings.AWS_ACCESS_KEY,
    aws_secret_access_key=settings.AWS_SECRET_KEY,
    region_name=settings.AWS_REGION
)

sts_client = boto3.client(
    "sts",
    aws_access_key_id=settings.AWS_ACCESS_KEY,
    aws_secret_access_key=settings.AWS_SECRET_KEY,
    region_name=settings.AWS_REGION
)

# Function to create IAM role
def create_iam_role(role_name: str, assume_role_policy: dict):
    try:
        response = iam_client.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=json.dumps(assume_role_policy)
        )
        return response["Role"]
    except ClientError as e:
        raise HTTPException(status_code=400, detail=f"IAM Role creation failed: {e}")

# Function to attach a policy to a role
def attach_role_policy(role_name: str, policy_arn: str):
    try:
        iam_client.attach_role_policy(RoleName=role_name, PolicyArn=policy_arn)
        return {"message": f"Policy {policy_arn} attached to {role_name}"}
    except ClientError as e:
        raise HTTPException(status_code=400, detail=f"Failed to attach policy: {e}")

# Function to assume a role and get temporary credentials
def assume_role(role_arn: str, session_name: str):
    try:
        response = sts_client.assume_role(
            RoleArn=role_arn,
            RoleSessionName=session_name
        )
        credentials = response["Credentials"]
        return {
            "AccessKeyId": credentials["AccessKeyId"],
            "SecretAccessKey": credentials["SecretAccessKey"],
            "SessionToken": credentials["SessionToken"]
        }
    except ClientError as e:
        raise HTTPException(status_code=400, detail=f"Failed to assume role: {e}")

# Function to list IAM roles
def list_roles():
    try:
        response = iam_client.list_roles()
        return response["Roles"]
    except ClientError as e:
        raise HTTPException(status_code=400, detail=f"Failed to list roles: {e}")

# Function to delete an IAM role
def delete_role(role_name: str):
    try:
        iam_client.delete_role(RoleName=role_name)
        return {"message": f"Role {role_name} deleted successfully"}
    except ClientError as e:
        raise HTTPException(status_code=400, detail=f"Failed to delete role: {e}")
