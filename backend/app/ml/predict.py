from typing import List, Dict, Any
from datetime import datetime, timedelta
from app.db.mongodb import db
from app.ml.model import LogAnomalyDetector
from app.db.models import LogAnalysisResult

async def get_recent_logs(hours: int = 1) -> List[Dict[str, Any]]:
    """Get logs from the last X hours for anomaly detection"""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(hours=hours)
    
    log_collection = db.db.logs
    cursor = log_collection.find({
        "timestamp": {"$gte": start_date, "$lte": end_date}
    })
    
    logs = await cursor.to_list(length=1000)
    return logs

async def detect_anomalies(hours: int = 1, threshold: float = 0.8) -> List[LogAnalysisResult]:
    """Detect anomalies in recent logs"""
    logs = await get_recent_logs(hours)
    
    if len(logs) == 0:
        print("No logs found for anomaly detection")
        return []
    
    detector = LogAnomalyDetector()
    if detector.model is None:
        print("Model not found, training new model")
        # You might want to train the model here or return an error
        return []
    
    # Detect anomalies
    anomalies = detector.detect_anomalies(logs)
    
    # Filter by threshold and convert to LogAnalysisResult
    results = []
    for log_entry, score in anomalies:
        if score >= threshold:
            severity = "high" if score > 0.9 else "medium" if score > 0.7 else "low"
            
            result = LogAnalysisResult(
                log_ids=[log_entry.get("_id", "")],
                severity=severity,
                anomaly_score=score,
                description=f"Anomaly detected in {log_entry.get('event_type', 'event')}",
                detected_at=datetime.utcnow()
            )
            results.append(result)
            
            # Also store the result in the database
            result_dict = result.dict()
            await db.db.anomaly_results.insert_one(result_dict)
    
    return results