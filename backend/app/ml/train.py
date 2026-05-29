"""
Train ETA RandomForest model on real Delhivery logistics shipment data.

Features (from real columns + derived load proxy):
  - distance_km          <- segment_osrm_distance
  - route_complexity     <- segment_osrm_time / distance
  - delivery_mode        <- route_type (FTL vs Carting)
  - load_factor          <- segment_factor (actual/osrm time ratio)
  - weight_kg            <- derived from distance * load_factor (real-data proxy)

Target:
  - delivery_hours       <- segment_actual_time / 60
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split

from app.data.download_data import download
from app.ml.config import META_PATH, MODEL_PATH, MODEL_DIR, DELHIVERY_CSV


FEATURE_COLUMNS = [
    "distance_km",
    "route_complexity",
    "delivery_mode",
    "load_factor",
    "weight_kg",
    "parcel_type_enc",
    "insurance_enc",
    "time_slot_enc",
]


def _prepare_training_frame(df: pd.DataFrame) -> pd.DataFrame:
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

    # Trip-level aggregation — cumulative columns max per trip gives full route metrics
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

    # Cap outliers from real logistics data (99th percentile)
    for col in ["distance_km", "delivery_minutes", "load_factor"]:
        cap = trip_df[col].quantile(0.99)
        trip_df = trip_df[trip_df[col] <= cap]

    trip_df["delivery_hours"] = trip_df["delivery_minutes"] / 60.0
    trip_df["route_complexity"] = trip_df["osrm_time"] / trip_df["distance_km"].clip(lower=0.1)

    route = trip_df["route_type"].astype(str).str.lower()
    trip_df["delivery_mode"] = route.apply(lambda x: 1 if "ftl" in x else 0)

    # Load proxy from real segment factor + distance (derived, not random)
    trip_df["weight_kg"] = (trip_df["distance_km"] * trip_df["load_factor"].fillna(1.0) * 0.15).clip(0.1, 50)

    trip_df["parcel_type_enc"] = trip_df["delivery_mode"].map({0: 0, 1: 1})
    trip_df["insurance_enc"] = 1
    trip_df["time_slot_enc"] = 3

    return trip_df


def train_model(force_download: bool = False) -> Tuple[Any, Dict[str, Any]]:
    csv_path = download(force=force_download) if force_download or not DELHIVERY_CSV.exists() else DELHIVERY_CSV
    if not csv_path.exists():
        csv_path = download(force=True)

    print(f"Loading training data from {csv_path}...")
    raw = pd.read_csv(csv_path, low_memory=False)
    print(f"  Raw rows: {len(raw):,}")

    prepared = _prepare_training_frame(raw)
    print(f"  Training rows after cleaning: {len(prepared):,}")

    X = prepared[FEATURE_COLUMNS].astype(float)
    y = prepared["delivery_hours"].astype(float)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(
        n_estimators=120,
        max_depth=18,
        min_samples_leaf=4,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mae = float(mean_absolute_error(y_test, preds))
    r2 = float(r2_score(y_test, preds))

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "features": FEATURE_COLUMNS}, MODEL_PATH)

    meta = {
        "model_type": "ml_random_forest",
        "dataset": "Delhivery Logistics (Kaggle)",
        "dataset_rows": len(raw),
        "training_rows": len(prepared),
        "mae_hours": round(mae, 3),
        "r2_score": round(r2, 4),
        "features": FEATURE_COLUMNS,
    }
    META_PATH.write_text(json.dumps(meta, indent=2))
    print(f"  Model saved: {MODEL_PATH}")
    print(f"  MAE: {mae:.2f} hours | R²: {r2:.4f}")
    return model, meta


if __name__ == "__main__":
    train_model(force_download="--force" in __import__("sys").argv)
