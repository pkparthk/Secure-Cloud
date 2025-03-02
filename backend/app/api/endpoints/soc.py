from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Any, Optional
from datetime import datetime, timedelta

from app.auth.permissions import soc_permission
from app.db.models import User, LogEntry, LogAnalysisResult
from app.db.mongodb import db
from app.aws.sts import get_role_credentials
from app.ml.predict import detect_anomalies, get_recent_logs
from app.ml.train import train_model

router = APIRouter()

@router.get("/logs", response_model=List[LogEntry])
async def get_logs(
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    event_type: Optional[str] = None,
    user_id: Optional[str] = None,
    limit: int = Query(100, gt=0, le=1000),
    current_user: User = Depends(soc_permission)
) -> Any:
    """
    Get system logs with optional filters (SOC only)
    """
    # Set default time range if not provided
    if not end_time:
        end_time = datetime.utcnow()
    if not start_time:
        start_time = end_time - timedelta(hours=24)
    
    # Build query
    query = {"timestamp": {"$gte": start_time, "$lte": end_time}}
    if event_type:
        query["event_type"] = {"$regex": event_type, "$options": "i"}
    if user_id:
        query["user_id"] = user_id
    
    # Get logs from database
    log_collection = db.db.logs
    cursor = log_collection.find(query).sort("timestamp", -1).limit(limit)
    logs = await cursor.to_list(length=limit)
    
    # Convert ObjectId to string for each log
    for log in logs:
        log["id"] = str(log.pop("_id"))
    
    # Log the action
    await db.db.logs.insert_one({
        "user_id": current_user.id,
        "event_type": "logs_viewed",
        "details": {
            "role": "soc", 
            "filter": {
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "event_type": event_type,
                "user_id": user_id,
                "limit": limit
            }
        }
    })
    
    return logs

@router.get("/anomalies", response_model=List[LogAnalysisResult])
async def get_anomalies(
    hours: int = Query(24, gt=0, le=168),
    threshold: float = Query(0.7, gt=0, le=1.0),
    current_user: User = Depends(soc_permission)
) -> Any:
    """
    Get detected anomalies in system logs (SOC only)
    """
    try:
        # Detect anomalies in logs
        anomalies = await detect_anomalies(hours=hours, threshold=threshold)
        
        # Log the action
        await db.db.logs.insert_one({
            "user_id": current_user.id,
            "event_type": "anomalies_detected",
            "details": {
                "role": "soc", 
                "count": len(anomalies),
                "hours": hours,
                "threshold": threshold
            }
        })
        
        return anomalies
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to detect anomalies: {str(e)}"
        )

@router.post("/train-model", response_model=dict)
async def train_anomaly_model(current_user: User = Depends(soc_permission)) -> Any:
    """
    Train the anomaly detection model using historical logs (SOC only)
    """
    try:
        # Train the model
        result = await train_model()
        
        # Log the action
        await db.db.logs.insert_one({
            "user_id": current_user.id,
            "event_type": "model_trained",
            "details": {
                "role": "soc", 
                "success": result
            }
        })
        
        return {"success": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to train model: {str(e)}"
        )

@router.get("/stats", response_model=dict)
async def get_security_stats(current_user: User = Depends(soc_permission)) -> Any:
    """
    Get security statistics from logs (SOC only)
    """
    log_collection = db.db.logs
    
    # Calculate time ranges
    now = datetime.utcnow()
    last_24h = now - timedelta(hours=24)
    last_7d = now - timedelta(days=7)
    
    # Get count of logs in different time periods
    total_logs = await log_collection.count_documents({})
    logs_24h = await log_collection.count_documents({"timestamp": {"$gte": last_24h}})
    logs_7d = await log_collection.count_documents({"timestamp": {"$gte": last_7d}})
    
    # Get login attempt stats
    login_attempts = await log_collection.count_documents({"event_type": "user_login"})
    failed_logins = await log_collection.count_documents({
        "event_type": "user_login",
        "details.success": False
    })
    
    # Get SSH session stats
    ssh_sessions = await log_collection.count_documents({"event_type": "ssh_session_created"})
    
    # Get anomaly stats
    anomaly_collection = db.db.anomaly_results
    total_anomalies = await anomaly_collection.count_documents({})
    high_severity = await anomaly_collection.count_documents({"severity": "high"})
    
    # Compile stats
    stats = {
        "total_logs": total_logs,
        "logs_last_24h": logs_24h,
        "logs_last_7d": logs_7d,
        "login_attempts": login_attempts,
        "failed_logins": failed_logins,
        "ssh_sessions": ssh_sessions,
        "total_anomalies": total_anomalies,
        "high_severity_anomalies": high_severity
    }
    
    # Log the action
    await db.db.logs.insert_one({
        "user_id": current_user.id,
        "event_type": "security_stats_viewed",
        "details": {"role": "soc"}
    })
    
    return stats