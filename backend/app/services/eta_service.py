from app.ml.config import DELHIVERY_CSV, MODEL_PATH
from app.ml.predict import predict_eta
from app.ml.train import train_model


def ensure_model_trained() -> str:
    """Auto-train on first run if model file missing."""
    if MODEL_PATH.exists():
        return "loaded"
    print("ETA model not found — training on real Delhivery logistics data...")
    _, meta = train_model(force_download=not DELHIVERY_CSV.exists())
    return meta.get("model_type", "ml_random_forest")


def get_eta_prediction(payload: dict) -> dict:
    return predict_eta(
        distance_km=payload["distance_km"],
        weight=payload["weight"],
        parcel_type=payload.get("parcel_type", "standard"),
        insurance=payload.get("insurance", "standard"),
        time_slot=payload.get("time_slot", "Anytime"),
        source_lat=payload.get("source_lat"),
        source_lng=payload.get("source_lng"),
        dest_lat=payload.get("dest_lat"),
        dest_lng=payload.get("dest_lng"),
    )
