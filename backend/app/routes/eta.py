from fastapi import APIRouter

from app.models.eta_schemas import PredictEtaRequest, PredictEtaResponse
from app.services.eta_service import get_eta_prediction

router = APIRouter(tags=["ETA Prediction"])


@router.post("/predict-eta", response_model=PredictEtaResponse)
def predict_eta_endpoint(payload: PredictEtaRequest):
    result = get_eta_prediction(payload.model_dump())
    return PredictEtaResponse(**result)
