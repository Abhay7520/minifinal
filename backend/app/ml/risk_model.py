"""
Train Delay Risk RandomForestClassifier model on real Delhivery logistics data.

Inputs:
  - distance_km
  - weight_kg
  - parcel_type_enc
  - delivery_mode (0 = standard, 1 = express/sameday)
  - route_complexity
  - weather_enc (0 = Clear, 1 = Rainy/Foggy, 2 = Stormy)
  - congestion_enc (0 = Low, 1 = Medium, 2 = High)

Outputs:
  - risk_level (0 = Low, 1 = Medium, 2 = High)
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
from sklearn.model_selection import train_test_split

from app.data.download_data import download
from app.ml.config import MODEL_DIR, DELHIVERY_CSV

MODEL_PATH = MODEL_DIR / "risk_model.pkl"
META_PATH = MODEL_DIR / "risk_model_meta.json"

FEATURE_COLUMNS = [
    "distance_km",
    "weight_kg",
    "parcel_type_enc",
    "delivery_mode",
    "route_complexity",
    "weather_enc",
    "congestion_enc",
]

def _prepare_risk_data(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    numeric_cols = [
        "actual_distance_to_destination",
        "actual_time",
        "osrm_time",
        "segment_osrm_distance",
        "segment_actual_time",
        "segment_osrm_time",
        "segment_factor",
        "start_scan_to_end_scan",
    ]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Aggregate by trip
    trip_cols = ["trip_uuid", "source_center", "destination_center", "route_type"]
    trip_df = (
        df.groupby(trip_cols, as_index=False)
        .agg(
            distance_km=("actual_distance_to_destination", "max"),
            delivery_minutes=("start_scan_to_end_scan", "max"),
            osrm_time=("osrm_time", "max"),
            load_factor=("segment_factor", "mean"),
        )
    )

    trip_df = trip_df.dropna(subset=["distance_km", "delivery_minutes"])
    trip_df = trip_df[(trip_df["distance_km"] > 0) & (trip_df["delivery_minutes"] > 0)]

    # Cap outliers
    for col in ["distance_km", "delivery_minutes", "load_factor"]:
        cap = trip_df[col].quantile(0.99)
        trip_df = trip_df[trip_df[col] <= cap]

    trip_df["delivery_hours"] = trip_df["delivery_minutes"] / 60.0
    trip_df["route_complexity"] = trip_df["osrm_time"] / trip_df["distance_km"].clip(lower=0.1)

    route = trip_df["route_type"].astype(str).str.lower()
    trip_df["delivery_mode"] = route.apply(lambda x: 1 if "ftl" in x else 0)
    trip_df["weight_kg"] = (trip_df["distance_km"] * trip_df["load_factor"].fillna(1.0) * 0.15).clip(0.1, 50)
    trip_df["parcel_type_enc"] = trip_df["delivery_mode"].map({0: 0, 1: 1})

    # Add simulated weather and congestion features to train
    np.random.seed(42)
    trip_df["weather_enc"] = np.random.choice([0, 1, 2], size=len(trip_df), p=[0.7, 0.2, 0.1])
    trip_df["congestion_enc"] = np.random.choice([0, 1, 2], size=len(trip_df), p=[0.6, 0.3, 0.1])

    # Assign risk labels based on logical conditions (incorporating distance, delay, weather, congestion)
    # Expected duration at average speed (55km/h) + hub overhead
    expected_hours = (trip_df["distance_km"] / 55.0) + 6.0
    actual_hours = trip_df["delivery_hours"]

    # Calculate delay ratio
    delay_ratio = actual_hours / expected_hours

    risk_labels = []
    for idx, row in trip_df.iterrows():
        ratio = delay_ratio.loc[idx]
        w = row["weather_enc"]
        c = row["congestion_enc"]
        dist = row["distance_km"]

        # High Risk conditions
        if w == 2 or ratio > 1.6 or (w == 1 and c == 2) or (dist > 800 and c == 2):
            risk_labels.append(2)  # High
        # Medium Risk conditions
        elif w == 1 or c == 1 or ratio > 1.2 or dist > 500 or row["weight_kg"] > 15:
            risk_labels.append(1)  # Medium
        # Low Risk
        else:
            risk_labels.append(0)  # Low

    trip_df["risk_level"] = risk_labels
    return trip_df

def train_risk_model(force_download: bool = False) -> Tuple[Any, Dict[str, Any]]:
    csv_path = download(force=force_download) if force_download or not DELHIVERY_CSV.exists() else DELHIVERY_CSV
    if not csv_path.exists():
        csv_path = download(force=True)

    print(f"Loading risk training data from {csv_path}...")
    raw = pd.read_csv(csv_path, low_memory=False)

    prepared = _prepare_risk_data(raw)
    print(f"  Training rows after labeling: {len(prepared):,}")

    X = prepared[FEATURE_COLUMNS].astype(float)
    y = prepared["risk_level"].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Initialize RandomForestClassifier
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        min_samples_leaf=4,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    acc = float(accuracy_score(y_test, preds))

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "features": FEATURE_COLUMNS}, MODEL_PATH)

    meta = {
        "model_type": "ml_random_forest_classifier",
        "dataset": "Delhivery Logistics (Augmented for Risk)",
        "training_rows": len(prepared),
        "accuracy": round(acc, 4),
        "features": FEATURE_COLUMNS,
    }
    META_PATH.write_text(json.dumps(meta, indent=2))
    print(f"  Risk Model saved: {MODEL_PATH}")
    print(f"  Accuracy: {acc:.4f}")
    return model, meta

if __name__ == "__main__":
    train_risk_model()
