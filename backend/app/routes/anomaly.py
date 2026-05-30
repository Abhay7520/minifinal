from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from app.services.anomaly_service import detect_anomaly_service, get_all_anomalies

router = APIRouter(tags=["AI Anomaly Detection"])

class AnomalyRequest(BaseModel):
    tracking_id: str = Field(..., description="The parcel tracking ID")
    inactive_hours: float = Field(..., ge=0, description="Hours the parcel has been inactive at the current location")
    current_hub: str = Field(..., description="Name of the current post office or sorting hub")
    expected_transition_hours: float = Field(default=5.0, ge=0, description="Standard transition hours expected for this corridor")

class AnomalyResponse(BaseModel):
    anomaly_detected: bool
    anomaly_score: float
    issue_type: str
    severity: str
    recommendation: str

@router.post("/detect-anomaly", response_model=AnomalyResponse)
def detect_anomaly_endpoint(payload: AnomalyRequest):
    try:
        result = detect_anomaly_service(payload.model_dump())
        return AnomalyResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anomaly detection failed: {str(e)}")

@router.get("/anomalies")
def list_anomalies_endpoint():
    try:
        return get_all_anomalies()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
