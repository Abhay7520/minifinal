import json
import joblib
from pathlib import Path
from typing import Dict, Any, List
import pandas as pd
import numpy as np

from app.ml.config import MODEL_DIR
from app.ml.risk_model import MODEL_PATH, META_PATH, FEATURE_COLUMNS

_model_cache = None
_meta_cache = None

def load_risk_model():
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
            _meta_cache = {"model_type": "ml_random_forest_classifier"}
    except Exception as e:
        print(f"Error loading risk model: {e}")
        return None, None

    return _model_cache, _meta_cache

def ensure_risk_model_trained() -> str:
    if MODEL_PATH.exists():
        return "loaded"
    print("Risk model not found — training classifier...")
    from app.ml.risk_model import train_risk_model
    _, meta = train_risk_model()
    return meta.get("model_type", "ml_random_forest_classifier")

def get_delay_risk_prediction(payload: Dict[str, Any]) -> Dict[str, Any]:
    # Ensure model is trained and load it
    ensure_risk_model_trained()
    bundle, meta = load_risk_model()

    distance_km = float(payload.get("distance_km", 0.0))
    weight = float(payload.get("weight", 1.0))
    parcel_type = str(payload.get("parcel_type", "standard")).lower()
    delivery_mode = 1 if parcel_type in ("express", "sameday") else 0
    
    # Extract weather
    weather = str(payload.get("weather", "Clear")).lower()
    weather_enc = 0
    if weather in ("rain", "rainy", "fog", "foggy"):
        weather_enc = 1
    elif weather in ("storm", "stormy", "monsoon", "snow"):
        weather_enc = 2

    # Extract congestion
    congestion = str(payload.get("congestion", "Low")).lower()
    congestion_enc = 0
    if congestion == "medium":
        congestion_enc = 1
    elif congestion == "high":
        congestion_enc = 2

    # Route complexity (same logic as ETA model)
    if distance_km < 50:
        complexity = 1.2
    elif distance_km < 300:
        complexity = 2.5
    elif distance_km < 800:
        complexity = 4.0
    else:
        complexity = 6.5

    parcel_type_enc = 0
    if parcel_type == "express":
        parcel_type_enc = 1
    elif parcel_type == "sameday":
        parcel_type_enc = 2
    elif parcel_type == "fragile":
        parcel_type_enc = 3
    elif parcel_type == "document":
        parcel_type_enc = 4

    features = [
        distance_km,
        weight,
        parcel_type_enc,
        delivery_mode,
        complexity,
        weather_enc,
        congestion_enc
    ]

    # Predict using model if available, else use fallback logic
    if bundle is not None:
        model = bundle["model"]
        feature_cols = bundle.get("features", FEATURE_COLUMNS)
        df_feat = pd.DataFrame([features], columns=feature_cols)
        
        # Predict probability
        probs = model.predict_proba(df_feat)[0]
        # Class 0: Low, Class 1: Medium, Class 2: High
        # Make sure probability classes match
        classes = model.classes_
        class_probs = {int(c): float(p) for c, p in zip(classes, probs)}
        
        # Risk score is weighted average or high-risk probability
        high_prob = class_probs.get(2, 0.0)
        med_prob = class_probs.get(1, 0.0)
        low_prob = class_probs.get(0, 0.0)
        
        risk_score = round((high_prob * 1.0) + (med_prob * 0.5), 2)
        
        # Determine level
        if high_prob > 0.4 or risk_score >= 0.65:
            risk_level = "High"
        elif med_prob > 0.4 or risk_score >= 0.3:
            risk_level = "Medium"
        else:
            risk_level = "Low"
    else:
        # Fallback rule-based risk
        score = 0.1
        if distance_km > 600:
            score += 0.25
        if weight > 15:
            score += 0.15
        if weather_enc == 1:
            score += 0.2
        elif weather_enc == 2:
            score += 0.45
        if congestion_enc == 1:
            score += 0.1
        elif congestion_enc == 2:
            score += 0.3

        risk_score = min(0.98, round(score, 2))
        if risk_score >= 0.65:
            risk_level = "High"
        elif risk_score >= 0.3:
            risk_level = "Medium"
        else:
            risk_level = "Low"

    # Compute risk factors dynamically
    risk_factors = []
    if distance_km > 800:
        risk_factors.append("Long-distance shipment")
    elif distance_km > 400:
        risk_factors.append("Inter-state transport stretch")
        
    if weight > 15:
        risk_factors.append("Heavy parcel sorting overhead")
        
    if weather_enc == 1:
        risk_factors.append("Adverse weather (rain/fog)")
    elif weather_enc == 2:
        risk_factors.append("Severe weather warnings (storms/monsoon)")
        
    if congestion_enc == 1:
        risk_factors.append("Moderate sorting hub traffic")
    elif congestion_enc == 2:
        risk_factors.append("High post office/sorting center congestion")

    if parcel_type == "sameday" and distance_km > 150:
        risk_factors.append("Sameday transit deadline tight")

    if not risk_factors:
        risk_factors.append("Optimal route conditions")

    # Recommendations
    recommendation = "No special handling required"
    if risk_level == "High":
        if weather_enc >= 1:
            recommendation = "Reroute through secondary dry-weather sorting hub and use Express Air priority handling"
        else:
            recommendation = "Prioritize express load dispatching and bypass congested urban post offices"
    elif risk_level == "Medium":
        if weight > 15:
            recommendation = "Use mechanical sorting lanes and standard priority queueing"
        else:
            recommendation = "Proceed with standard routing but flag for evening batch processing"

    return {
        "risk_level": risk_level,
        "risk_score": risk_score,
        "risk_factors": risk_factors,
        "recommendation": recommendation
    }
