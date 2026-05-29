"""
Train Isolation Forest model for logistics anomaly detection.

Features:
  - inactive_hours
  - expected_transition_hours
  - inactive_ratio (inactive_hours / expected_transition_hours)
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

from app.ml.config import MODEL_DIR

MODEL_PATH = MODEL_DIR / "anomaly_model.pkl"
META_PATH = MODEL_DIR / "anomaly_model_meta.json"

FEATURE_COLUMNS = [
    "inactive_hours",
    "expected_transition_hours",
    "inactive_ratio",
]

def _generate_synthetic_logistics_data(num_samples: int = 1200) -> pd.DataFrame:
    np.random.seed(42)
    
    # 85% normal tracking transitions
    num_normal = int(num_samples * 0.85)
    normal_expected = np.random.uniform(2.0, 8.0, size=num_normal)
    # inactive_hours are normally distributed around half the expected transition time
    normal_inactive = normal_expected * np.random.uniform(0.1, 0.9, size=num_normal)
    
    # 15% anomalies (stuck packages, severe delays)
    num_anom = num_samples - num_normal
    anom_expected = np.random.uniform(2.0, 8.0, size=num_anom)
    # inactive_hours are 2.5x to 15x higher than expected
    anom_inactive = anom_expected * np.random.uniform(2.5, 12.0, size=num_anom)
    # Add some absolute extreme stuck delays (e.g. stuck for 48 to 96 hours)
    extreme_indices = np.random.choice(range(num_anom), size=num_anom // 2, replace=False)
    anom_inactive[extreme_indices] = np.random.uniform(36.0, 96.0, size=len(extreme_indices))

    expected = np.concatenate([normal_expected, anom_expected])
    inactive = np.concatenate([normal_inactive, anom_inactive])
    
    df = pd.DataFrame({
        "expected_transition_hours": expected,
        "inactive_hours": inactive
    })
    
    df["inactive_ratio"] = df["inactive_hours"] / df["expected_transition_hours"]
    return df

def train_anomaly_model() -> Tuple[Any, Dict[str, Any]]:
    print("Generating training dataset for logistics anomalies...")
    df = _generate_synthetic_logistics_data(1500)
    
    X = df[FEATURE_COLUMNS].astype(float)
    
    # Train Isolation Forest
    model = IsolationForest(
        contamination=0.15,
        random_state=42,
        n_estimators=100
    )
    model.fit(X)
    
    # Evaluate
    preds = model.predict(X) # 1 = normal, -1 = anomaly
    anoms_count = np.sum(preds == -1)
    
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "features": FEATURE_COLUMNS}, MODEL_PATH)
    
    meta = {
        "model_type": "isolation_forest",
        "dataset": "Simulated Logistics Activity Logs",
        "training_rows": len(df),
        "anomalies_detected_in_train": int(anoms_count),
        "contamination": 0.15,
        "features": FEATURE_COLUMNS,
    }
    
    META_PATH.write_text(json.dumps(meta, indent=2))
    print(f"  Anomaly Model saved: {MODEL_PATH}")
    print(f"  Detected {anoms_count} anomalies in training dataset of size {len(df)}")
    return model, meta

if __name__ == "__main__":
    train_anomaly_model()
