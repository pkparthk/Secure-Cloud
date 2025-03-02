import boto3
from typing import Dict, List, Any
from app.db.models import VM
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def list_ec2_instances():
    return {"message": "List of EC2 instances"}


def get_ec2_client(credentials: Dict[str, Any]) -> boto3.client:
    """Creates an EC2 client using provided AWS credentials."""
    return boto3.client(
        'ec2',
        region_name=credentials.get('region', 'us-east-1'),
        aws_access_key_id=credentials['aws_access_key_id'],
        aws_secret_access_key=credentials['aws_secret_access_key'],
        aws_session_token=credentials.get('aws_session_token')
    )

def list_instances(credentials: Dict[str, Any]) -> List[VM]:
    """Lists all EC2 instances and returns them as VM objects."""
    ec2_client = get_ec2_client(credentials)
    response = ec2_client.describe_instances()
    
    instances = []
    for reservation in response.get('Reservations', []):
        for instance in reservation.get('Instances', []):
            # Convert AWS tags to dictionary format
            tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}
            
            vm = VM(
                id=instance['InstanceId'],
                name=tags.get('Name', instance['InstanceId']),
                instance_type=instance['InstanceType'],
                status=instance['State']['Name'],
                public_ip=instance.get('PublicIpAddress'),
                private_ip=instance.get('PrivateIpAddress'),
                environment=tags.get('Environment', 'unknown'),
                tags=tags
            )
            instances.append(vm)
    
    return instances

def get_instance_by_id(credentials: Dict[str, Any], instance_id: str) -> VM:
    """Retrieves details of a specific EC2 instance by ID."""
    ec2_client = get_ec2_client(credentials)
    response = ec2_client.describe_instances(InstanceIds=[instance_id])
    
    reservations = response.get('Reservations', [])
    if not reservations or not reservations[0].get('Instances', []):
        raise ValueError(f"Instance {instance_id} not found")
    
    instance = reservations[0]['Instances'][0]
    tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}
    
    return VM(
        id=instance['InstanceId'],
        name=tags.get('Name', instance['InstanceId']),
        instance_type=instance['InstanceType'],
        status=instance['State']['Name'],
        public_ip=instance.get('PublicIpAddress'),
        private_ip=instance.get('PrivateIpAddress'),
        environment=tags.get('Environment', 'unknown'),
        tags=tags
    )
