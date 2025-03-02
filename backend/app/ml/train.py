import asyncio
from typing import List, Dict, Any
from datetime import datetime, timedelta
from app.db.mongodb import db
from app.ml.model import LogAnomalyDetector

async def get_training_logs() -> List[Dict[str, Any]]:
    """Get logs from the database for training the ML model"""
    # Get logs from the last 30 days
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)
    
    log_collection = db.db.logs
    cursor = log_collection.find({
        "timestamp": {"$gte": start_date, "$lte": end_date}
    })
    
    logs = await cursor.to_list(length=10000)
    return logs

async def train_model():
    """Train the anomaly detection model using logs from the database"""
    logs = await get_training_logs()
    
    if len(logs) < 100:
        print("Not enough log data for training (minimum 100 required)")
        return False
    
    detector = LogAnomalyDetector()
    result = detector.train(logs)
    
    print(f"Model training {'succeeded' if result else 'failed'}")
    return result