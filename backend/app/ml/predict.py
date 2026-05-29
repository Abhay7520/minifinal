from __future__ import annotations

import json
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd

from app.ml.config import (
    INSURANCE_MAP,
    META_PATH,
    MODEL_PATH,
    PARCEL_TYPE_MAP,
    TIME_SLOT_MAP,
)

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

_model_cache: Optional[Dict[str, Any]] = None
_meta_cache: Optional[Dict[str, Any]] = None


def load_model() -> Tuple[Optional[Any], Optional[List[str]], str]:
    global _model_cache, _meta_cache

    if _model_cache is not None:
        bundle = _model_cache
        meta = _meta_cache or {}
        return bundle["model"], bundle.get("features", FEATURE_COLUMNS), meta.get("model_type", "ml_random_forest")

    if not MODEL_PATH.exists():
        return None, None, "fallback_model"

    bundle = joblib.load(MODEL_PATH)
    _model_cache = bundle
    if META_PATH.exists():
        _meta_cache = json.loads(META_PATH.read_text())
    else:
        _meta_cache = {"model_type": "ml_random_forest"}

    return bundle["model"], bundle.get("features", FEATURE_COLUMNS), _meta_cache.get("model_type", "ml_random_forest")


def _build_features(
    distance_km: float,
    weight: float,
    parcel_type: str,
    insurance: str,
    time_slot: str,
) -> np.ndarray:
    parcel_enc = PARCEL_TYPE_MAP.get(parcel_type.lower(), 0)
    insurance_enc = INSURANCE_MAP.get(insurance.lower(), 1)
    slot_enc = TIME_SLOT_MAP.get(time_slot, 3)

    # Route complexity bucket from real-data distance patterns
    if distance_km < 50:
        complexity = 1.2
    elif distance_km < 300:
        complexity = 2.5
    elif distance_km < 800:
        complexity = 4.0
    else:
        complexity = 6.5

    delivery_mode = 1 if parcel_enc in (1, 2) else 0
    load_factor = max(1.0, weight / max(distance_km, 1) * 10)

    return np.array([[
        distance_km,
        complexity,
        delivery_mode,
        load_factor,
        weight,
        parcel_enc,
        insurance_enc,
        slot_enc,
    ]])


def _parcel_type_multiplier(parcel_type: str) -> float:
    return {
        "standard": 1.0,
        "express": 0.65,
        "sameday": 0.35,
        "fragile": 1.25,
        "document": 0.9,
    }.get(parcel_type.lower(), 1.0)


def _fallback_predict(
    distance_km: float,
    weight: float,
    parcel_type: str,
) -> float:
    """Rule-based ETA hours when ML model unavailable."""
    base_hours = (distance_km / 55.0) * 8  # road + hub processing
    weight_factor = 1.0 + max(0, weight - 5) * 0.04
    return base_hours * _parcel_type_multiplier(parcel_type) * weight_factor


def _compute_risk_factors(
    distance_km: float,
    weight: float,
    parcel_type: str,
    insurance: str,
    estimated_hours: float,
) -> List[str]:
    risks: List[str] = []
    if distance_km > 800:
        risks.append("high distance")
    elif distance_km > 400:
        risks.append("long haul route")

    if weight > 15:
        risks.append("heavy parcel")
    elif weight > 8:
        risks.append("above average weight")

    if parcel_type.lower() in ("fragile",):
        risks.append("fragile handling required")

    if parcel_type.lower() == "sameday" and distance_km > 100:
        risks.append("sameday stretch for distance")

    if insurance.lower() == "basic" and weight > 5:
        risks.append("limited insurance coverage")

    if estimated_hours > 72:
        risks.append("multi-day transit")

    if not risks:
        risks.append("route within normal parameters")

    return risks


def predict_eta(
    distance_km: float,
    weight: float,
    parcel_type: str,
    insurance: str = "standard",
    time_slot: str = "Anytime",
    source_lat: Optional[float] = None,
    source_lng: Optional[float] = None,
    dest_lat: Optional[float] = None,
    dest_lng: Optional[float] = None,
) -> Dict[str, Any]:
    model, features, model_type = load_model()
    using_ml = model is not None

    if using_ml:
        X = _build_features(distance_km, weight, parcel_type, insurance, time_slot)
        feature_df = pd.DataFrame(X, columns=features or FEATURE_COLUMNS)
        raw_hours = float(model.predict(feature_df)[0])
        raw_hours *= _parcel_type_multiplier(parcel_type)
        # Scale for inter-city distances beyond Delhivery hub training distribution
        if distance_km > 500:
            hub_factor = 1.0 + (distance_km - 500) / 800
            raw_hours *= hub_factor
        # Realistic floor: ~450 km/day effective incl. sorting hubs (India logistics benchmark)
        if distance_km > 300:
            distance_floor = (distance_km / 450.0) * 18.0
            raw_hours = max(raw_hours, distance_floor)
        estimated_hours = max(1.0, raw_hours)
    else:
        model_type = "fallback_model"
        estimated_hours = max(1.0, _fallback_predict(distance_km, weight, parcel_type))

    # Time slot adjustment
    slot_adj = {"Morning": 0.95, "Afternoon": 1.0, "Evening": 1.05, "Anytime": 1.0}
    estimated_hours *= slot_adj.get(time_slot, 1.0)

    estimated_days = round(estimated_hours / 24.0, 2)
    min_days = max(0.5, round(estimated_days * 0.85, 1))
    max_days = max(min_days + 0.5, round(estimated_days * 1.2, 1))

    # Confidence from model metadata or heuristic
    if using_ml and _meta_cache:
        r2 = _meta_cache.get("r2_score", 0.75)
        confidence = min(0.97, max(0.55, r2 * (1.0 - min(distance_km / 5000, 0.15))))
    else:
        confidence = 0.62

    risk_factors = _compute_risk_factors(
        distance_km, weight, parcel_type, insurance, estimated_hours
    )

    return {
        "estimated_days": estimated_days,
        "estimated_hours": round(estimated_hours, 1),
        "eta_range": {
            "min_days": min_days,
            "max_days": max_days,
        },
        "confidence_score": round(confidence, 2),
        "risk_factors": risk_factors,
        "model_type": model_type if using_ml else "fallback_model",
    }
