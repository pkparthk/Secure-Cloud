import pandas as pd
import numpy as np
from typing import List, Dict, Any, Tuple
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os

class LogAnomalyDetector:
    def __init__(self, model_path: str = "ml_models/anomaly_detector.joblib"):
        self.model_path = model_path
        self.model = None
        self.scaler = None
        self.feature_columns = [
            'hour_of_day',
            'day_of_week',
            'is_weekend',
            'login_attempts',
            'failed_login_attempts',
            'sudo_commands',
            'file_operations',
            'network_connections',
            'unique_ips'
        ]
        
        # Try to load the model if it exists
        if os.path.exists(model_path):
            self._load_model()
    
    def _load_model(self):
        try:
            loaded = joblib.load(self.model_path)
            self.model = loaded['model']
            self.scaler = loaded['scaler']
            print(f"Model loaded from {self.model_path}")
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            self.model = None
            self.scaler = None
    
    def _save_model(self):
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        
        # Save model and scaler
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler
        }, self.model_path)
        print(f"Model saved to {self.model_path}")
    
    def train(self, log_data: List[Dict[str, Any]]):
        """Train anomaly detection model using log data"""
        # Convert to DataFrame
        df = pd.DataFrame(log_data)
        
        # Feature engineering
        df = self._extract_features(df)
        
        # Scale features
        self.scaler = StandardScaler()
        X = self.scaler.fit_transform(df[self.feature_columns])
        
        # Train isolation forest
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.05,  # Assume 5% of data might be anomalous
            random_state=42
        )
        self.model.fit(X)
        
        # Save the model
        self._save_model()
        
        return True
    
    def detect_anomalies(self, log_data: List[Dict[str, Any]]) -> List[Tuple[Dict[str, Any], float]]:
        """Detect anomalies in log data"""
        if self.model is None or self.scaler is None:
            raise ValueError("Model not trained yet")
        
        # Convert to DataFrame
        df = pd.DataFrame(log_data)
        df = self._extract_features(df)
        
        # Scale features
        X = self.scaler.transform(df[self.feature_columns])
        
        # Predict anomalies
        # Isolation Forest returns -1 for anomalies and 1 for normal data
        # We convert to anomaly scores where higher = more anomalous
        raw_scores = self.model.decision_function(X)
        anomaly_scores = 1 - (raw_scores + 1) / 2  # Convert to 0-1 range
        
        # Combine results with original data
        results = []
        for i, (_, row) in enumerate(df.iterrows()):
            # Get the original log entry
            log_entry = log_data[i]
            score = anomaly_scores[i]
            results.append((log_entry, float(score)))
        
        # Sort by anomaly score (highest first)
        results.sort(key=lambda x: x[1], reverse=True)
        
        return results
    
    def _extract_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extract features from log data for anomaly detection"""
        # Convert timestamp to datetime if it's not already
        if 'timestamp' in df.columns and not pd.api.types.is_datetime64_any_dtype(df['timestamp']):
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Extract time features
        df['hour_of_day'] = df['timestamp'].dt.hour
        df['day_of_week'] = df['timestamp'].dt.dayofweek
        df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
        
        # Initialize counters if they don't exist
        for col in ['login_attempts', 'failed_login_attempts', 'sudo_commands', 
                    'file_operations', 'network_connections', 'unique_ips']:
            if col not in df.columns:
                df[col] = 0
        
        # Parse event_type and details to extract more features
        for i, row in df.iterrows():
            event = row.get('event_type', '')
            details = row.get('details', {})
            
            if 'login' in event:
                df.at[i, 'login_attempts'] = 1
                if details.get('success') == False:
                    df.at[i, 'failed_login_attempts'] = 1
            
            if 'sudo' in event or ('command' in details and 'sudo' in details.get('command', '')):
                df.at[i, 'sudo_commands'] = 1
            
            if 'file' in event or any(op in event for op in ['read', 'write', 'delete']):
                df.at[i, 'file_operations'] = 1
            
            if 'network' in event or 'connection' in event:
                df.at[i, 'network_connections'] = 1
                
            # Count unique IPs if source_ip exists
            if 'source_ip' in row and row['source_ip']:
                df.at[i, 'unique_ips'] = 1
        
        # Ensure all feature columns exist
        for col in self.feature_columns:
            if col not in df.columns:
                df[col] = 0
        
        return df