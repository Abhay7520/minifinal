import json
import joblib
import datetime
from pathlib import Path
from typing import Dict, Any, List
import numpy as np
import pandas as pd

from app.ml.config import MODEL_DIR
from app.ml.anomaly_model import MODEL_PATH, META_PATH, FEATURE_COLUMNS
from app.utils.mongo import db_service

_model_cache = None
_meta_cache = None

def load_anomaly_model():
    global _model_cache, _meta_cache
    if _model_cache is not None:
        return _model_cache, _meta_cache

    if not MODEL_PATH.exists():
        return None, None

    try:
        _model_cache = joblib.load(MODEL_PATH)
        if META_PATH.exists():
            _meta_cache = json.loads(META_PATH.read_text())
        else:
            _meta_cache = {"model_type": "isolation_forest"}
    except Exception as e:
        print(f"Error loading anomaly model: {e}")
        return None, None

    return _model_cache, _meta_cache

def ensure_anomaly_model_trained() -> str:
    if MODEL_PATH.exists():
        return "loaded"
    print("Anomaly model not found — training isolation forest...")
    from app.ml.anomaly_model import train_anomaly_model
    _, meta = train_anomaly_model()
    return meta.get("model_type", "isolation_forest")

def detect_anomaly_service(payload: Dict[str, Any]) -> Dict[str, Any]:
    ensure_anomaly_model_trained()
    bundle, meta = load_anomaly_model()

    tracking_id = str(payload.get("tracking_id", "AIP123456"))
    inactive_hours = float(payload.get("inactive_hours", 0.0))
    expected_transition_hours = float(payload.get("expected_transition_hours", 4.0))
    current_hub = str(payload.get("current_hub", "Central Sorting Hub"))
    
    inactive_ratio = inactive_hours / max(0.1, expected_transition_hours)
    features = [inactive_hours, expected_transition_hours, inactive_ratio]

    anomaly_detected = False
    raw_score = 0.0

    if bundle is not None:
        model = bundle["model"]
        feature_cols = bundle.get("features", FEATURE_COLUMNS)
        df_feat = pd.DataFrame([features], columns=feature_cols)
        
        # Isolation forest predict: -1 is anomaly, 1 is normal
        pred = model.predict(df_feat)[0]
        # score_samples returns raw anomaly score (offset). The lower, the more anomalous.
        raw_score = float(model.score_samples(df_feat)[0])
        
        # Convert raw_score to standard 0-1 anomaly score
        # Normally raw_score is between -0.8 (most anomalous) and -0.4 (least anomalous)
        normalized_score = round(max(0.0, min(1.0, (0.5 - raw_score) * 2.5)), 2)
        
        if pred == -1 or normalized_score > 0.6 or inactive_ratio >= 2.0:
            anomaly_detected = True
    else:
        # Fallback heuristic
        normalized_score = round(min(0.99, max(0.05, inactive_ratio * 0.25)), 2)
        if inactive_ratio >= 2.0 or inactive_hours >= 18.0:
            anomaly_detected = True

    # Compute issue details based on values
    issue_type = "None"
    severity = "Green"
    recommendation = "Shipment proceeding normally."

    if anomaly_detected:
        if inactive_hours >= 48.0:
            issue_type = "Stuck Parcel"
            severity = "Critical"
            recommendation = f"Immediate action required: Dispatch supervisor to inspect sorting floor at {current_hub} Center."
        elif inactive_hours >= 18.0:
            issue_type = "Unusual Delay"
            severity = "High"
            recommendation = f"Investigate transition delays. Contact sorting coordinator at {current_hub} Center."
        elif inactive_ratio >= 2.2:
            issue_type = "Abnormal Inactivity"
            severity = "High"
            recommendation = f"Flagged for inactivity. Reschedule shipment slot for next outbound cargo batch."
        else:
            issue_type = "Repeated Hub Failure"
            severity = "Medium"
            recommendation = "Monitor sorting logs. If delay continues past 12 hours, trigger manual redirect routing."
    elif inactive_hours > expected_transition_hours:
        issue_type = "Slight Delay"
        severity = "Yellow" # Warning
        recommendation = "Standard processing backlog. Expecting departure within 4 hours."

    # Save to anomaly_logs in MongoDB
    anomaly_logs_col = db_service.get_collection("anomaly_logs")
    log_doc = {
        "tracking_id": tracking_id,
        "anomaly_detected": anomaly_detected,
        "anomaly_score": normalized_score,
        "issue_type": issue_type,
        "severity": severity,
        "recommendation": recommendation,
        "current_hub": current_hub,
        "inactive_hours": inactive_hours,
        "expected_transition_hours": expected_transition_hours,
        "created_at": datetime.datetime.now(datetime.timezone.utc)
    }
    anomaly_logs_col.insert_one(log_doc)

    return {
        "anomaly_detected": anomaly_detected,
        "anomaly_score": normalized_score,
        "issue_type": issue_type,
        "severity": severity,
        "recommendation": recommendation
    }

def get_all_anomalies() -> List[Dict[str, Any]]:
    anomaly_logs_col = db_service.get_collection("anomaly_logs")
    # Fetch latest anomalies where anomaly_detected is True or severity is Critical/High/Medium
    cursor = anomaly_logs_col.find(
        {"$or": [{"anomaly_detected": True}, {"severity": {"$in": ["Critical", "High", "Medium"]}}]}
    ).sort("created_at", -1).limit(30)
    
    results = []
    seen_tracking = set()
    for doc in cursor:
        tracking_id = doc.get("tracking_id")
        if tracking_id in seen_tracking:
            continue
        seen_tracking.add(tracking_id)
        doc["created_at"] = doc["created_at"].strftime("%Y-%m-%d %H:%M")
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
        results.append(doc)
        
    # If list is empty, return a few default mock ones so the admin dashboard is populated
    if not results:
        results = [
            {
                "tracking_id": "AP-20260099",
                "issue_type": "Stuck Parcel",
                "severity": "Critical",
                "current_hub": "Delhi Hub",
                "anomaly_score": 0.91,
                "recommendation": "Investigate sorting hub delay. Package static for 72+ hours."
            },
            {
                "tracking_id": "AP-20260087",
                "issue_type": "Repeated Route Failure",
                "severity": "High",
                "current_hub": "Pune GPO",
                "anomaly_score": 0.82,
                "recommendation": "Repeated route failure on MH-RJ corridor. Check dispatch schedule."
            },
            {
                "tracking_id": "AP-20260074",
                "issue_type": "Abnormal Inactivity",
                "severity": "Medium",
                "current_hub": "Mumbai Central",
                "anomaly_score": 0.65,
                "recommendation": "Package static for 24+ hours at sorting center."
            }
        ]
    return results
