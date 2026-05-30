from typing import List, Optional

from pydantic import BaseModel, Field


class PredictEtaRequest(BaseModel):
    source_lat: float
    source_lng: float
    dest_lat: float
    dest_lng: float
    distance_km: float = Field(..., gt=0)
    weight: float = Field(..., gt=0, le=500)
    parcel_type: str = Field(default="standard")
    insurance: str = Field(default="standard")
    time_slot: str = Field(default="Anytime")


class EtaRange(BaseModel):
    min_days: float
    max_days: float


class PredictEtaResponse(BaseModel):
    estimated_days: float
    estimated_hours: float
    eta_range: EtaRange
    confidence_score: float
    risk_factors: List[str]
    model_type: str
