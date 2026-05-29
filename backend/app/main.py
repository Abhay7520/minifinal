from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes.address import router as address_router
from app.routes.eta import router as eta_router
from app.services.data_loader import data_store
from app.services.eta_service import ensure_model_trained


@asynccontextmanager
async def lifespan(_app: FastAPI):
    data_store.load()
    ensure_model_trained()
    yield


app = FastAPI(
    title=settings.app_name,
    description="AI-powered address validation, post office identification, and ETA prediction for AIPOSTAL",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(address_router)
app.include_router(eta_router)


@app.get("/health")
def health():
    from app.ml.config import MODEL_PATH, META_PATH
    import json

    eta_meta = {}
    if META_PATH.exists():
        eta_meta = json.loads(META_PATH.read_text())

    return {
        "status": "ok",
        "dataset_source": "India Post 2026 (Department of Posts)",
        "addresses_loaded": len(data_store.addresses) if hasattr(data_store, "addresses") else 0,
        "post_offices_loaded": len(data_store.post_offices) if hasattr(data_store, "post_offices") else 0,
        "unique_pincodes": len(data_store.pin_codes) if hasattr(data_store, "pin_codes") else 0,
        "eta_model_ready": MODEL_PATH.exists(),
        "eta_model_type": eta_meta.get("model_type", "not_trained"),
        "eta_training_rows": eta_meta.get("training_rows", 0),
    }
