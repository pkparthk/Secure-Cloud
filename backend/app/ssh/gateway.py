import asyncio
import websockets
import paramiko
import uuid
import json
from typing import Dict, Optional

from app.core.config import settings
from app.db.mongodb import db

# Store active SSH sessions
active_sessions: Dict[str, Dict] = {}

async def create_ssh_session(user_id: str, vm_id: str, vm_ip: str, credentials: Dict) -> str:
    # Generate unique session token
    session_token = str(uuid.uuid4())
    
    # Create SSH session record in database
    session_collection = db.db.ssh_sessions
    session_data = {
        "user_id": user_id,
        "vm_id": vm_id,
        "active": True,
        "session_token": session_token
    }
    
    await session_collection.insert_one(session_data)
    
    # Store session info in memory
    active_sessions[session_token] = {
        "user_id": user_id,
        "vm_id": vm_id,
        "vm_ip": vm_ip,
        "credentials": credentials,
        "ssh_client": None
    }
    
    return session_token

async def end_ssh_session(session_token: str) -> bool:
    if session_token not in active_sessions:
        return False
    
    # Close SSH connection if it exists
    if active_sessions[session_token]["ssh_client"]:
        active_sessions[session_token]["ssh_client"].close()
    
    # Update database record
    session_collection = db.db.ssh_sessions
    await session_collection.update_one(
        {"session_token": session_token},
        {"$set": {"active": False, "end_time": "now()"}}
    )
    
    # Remove from active sessions
    del active_sessions[session_token]
    
    return True

async def handle_ssh_websocket(websocket, session_token: str):
    if session_token not in active_sessions:
        await websocket.send(json.dumps({"error": "Invalid session token"}))
        return
    
    session = active_sessions[session_token]
    
    # Create SSH client if it doesn't exist yet
    if not session["ssh_client"]:
        try:
            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            client.connect(
                hostname=session["vm_ip"],
                username="ec2-user",  # Or the appropriate user for your AMI
                # Use AWS credentials for SSH access
                # This is a simplified example - in practice, you would use SSH keys
                # or a more secure authentication method
            )
            
            session["ssh_client"] = client
            channel = client.invoke_shell()
            session["channel"] = channel
            
            # Log successful connection
            log_collection = db.db.logs
            await log_collection.insert_one({
                "user_id": session["user_id"],
                "event_type": "ssh_connection",
                "details": {
                    "vm_id": session["vm_id"],
                    "vm_ip": session["vm_ip"]
                }
            })
            
        except Exception as e:
            await websocket.send(json.dumps({"error": f"SSH connection failed: {str(e)}"}))
            return
    
    channel = session["channel"]
    
    # Set up bidirectional communication
    async def receive_from_websocket():
        try:
            while True:
                message = await websocket.recv()
                data = json.loads(message)
                if "command" in data:
                    channel.send(data["command"] + "\n")
        except websockets.exceptions.ConnectionClosed:
            await end_ssh_session(session_token)
    
    async def send_to_websocket():
        try:
            while True:
                if channel.recv_ready():
                    output = channel.recv(4096).decode("utf-8")
                    await websocket.send(json.dumps({"output": output}))
                await asyncio.sleep(0.1)
        except:
            await end_ssh_session(session_token)
    
    # Start both tasks
    receive_task = asyncio.create_task(receive_from_websocket())
    send_task = asyncio.create_task(send_to_websocket())
    
    try:
        await asyncio.gather(receive_task, send_task)
    except asyncio.CancelledError:
        receive_task.cancel()
        send_task.cancel()