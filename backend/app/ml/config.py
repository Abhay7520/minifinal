from pathlib import Path

APP_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = APP_DIR / "data"
MODEL_DIR = APP_DIR / "model"
MODEL_PATH = MODEL_DIR / "eta_model.pkl"
META_PATH = MODEL_DIR / "eta_model_meta.json"
DELHIVERY_CSV = DATA_DIR / "delhivery_logistics.csv"

PARCEL_TYPE_MAP = {
    "standard": 0,
    "express": 1,
    "sameday": 2,
    "fragile": 3,
    "document": 4,
}

INSURANCE_MAP = {
    "basic": 0,
    "standard": 1,
    "premium": 2,
}

TIME_SLOT_MAP = {
    "Morning": 0,
    "Afternoon": 1,
    "Evening": 2,
    "Anytime": 3,
}

ROUTE_TYPE_MAP = {
    "carting": 0,
    "ftl": 1,
}
