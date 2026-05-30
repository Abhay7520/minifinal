from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Optional

from app.services.risk_service import get_delay_risk_prediction

router = APIRouter(tags=["AI Delay Risk Detection"])

class DelayRiskRequest(BaseModel):
    source_address: str = Field(..., description="Source full address")
    destination_address: str = Field(..., description="Destination full address")
    distance_km: float = Field(..., gt=0, description="Routing distance in kilometers")
    weight: float = Field(..., gt=0, description="Weight of the parcel in kg")
    parcel_type: str = Field(default="standard", description="standard, express, sameday, fragile, or document")
    eta_days: Optional[float] = Field(default=None, description="Predicted ETA in days")
    delivery_mode: Optional[str] = Field(default=None, description="FTL, Carting, or Standard")
    weather: Optional[str] = Field(default="Clear", description="Clear, Rainy, Foggy, Stormy")
    congestion: Optional[str] = Field(default="Low", description="Low, Medium, High post office congestion")

class DelayRiskResponse(BaseModel):
    risk_level: str = Field(..., description="Low, Medium, or High")
    risk_score: float = Field(..., description="Risk probability score (0 to 1)")
    risk_factors: List[str] = Field(..., description="List of contributing risk factors")
    recommendation: str = Field(..., description="AI mitigation recommendation")

@router.post("/predict-delay-risk", response_model=DelayRiskResponse)
def predict_delay_risk_endpoint(payload: DelayRiskRequest):
    # Predict delay risk using service
    result = get_delay_risk_prediction(payload.model_dump())
    return DelayRiskResponse(**result)
