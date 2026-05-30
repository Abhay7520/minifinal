from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Any
from app.services.tracking_service import create_parcel, get_tracking_info, advance_tracking_stage, get_all_parcels

router = APIRouter(tags=["Tracking & Booking"])

class ParcelBookingRequest(BaseModel):
    sender_name: str = Field(..., min_length=1)
    sender_phone: str = Field(..., min_length=5)
    source_address: str = Field(..., min_length=2)
    source_lat: float
    source_lng: float
    source_po: str
    
    receiver_name: str = Field(..., min_length=1)
    receiver_phone: str = Field(..., min_length=5)
    destination_address: str = Field(..., min_length=2)
    dest_lat: float
    dest_lng: float
    dest_po: str
    
    weight: float = Field(..., gt=0)
    parcel_type: str = Field(default="standard")
    declared_value: float = Field(default=0.0)
    category: str = Field(default="other")
    time_slot: str = Field(default="Anytime")
    insurance: str = Field(default="standard")
    
    distance_km: float = Field(..., gt=0)
    duration_hours: float = Field(..., gt=0)
    duration_text: str = Field(..., min_length=1)
    transit_days: str = Field(..., min_length=1)
    route_coordinates: List[List[float]] = Field(..., min_length=2)
    
    price_total: float = Field(..., ge=0)
    weather: Optional[str] = "Clear"
    congestion: Optional[str] = "Low"

class BookingResponse(BaseModel):
    tracking_id: str
    message: str

class TimelineItem(BaseModel):
    status: str
    time: str
    location: str
    details: str
    done: bool
    predicted: bool

class RiskInfo(BaseModel):
    risk_level: str
    risk_score: float
    risk_factors: List[str]
    recommendation: str

class ParcelDetails(BaseModel):
    source_address: str
    destination_address: str
    sender_name: str
    receiver_name: str
    weight: float
    parcel_type: str
    price_total: float
    source_lat: float
    source_lng: float
    dest_lat: float
    dest_lng: float
    route_coordinates: List[List[float]]


class TrackingResponse(BaseModel):
    tracking_id: str
    current_status: str
    progress_percentage: int
    current_location: str
    current_lat: float
    current_lng: float
    estimated_delivery: str
    timeline: List[TimelineItem]
    risk_info: RiskInfo
    parcel_details: ParcelDetails

@router.post("/parcels", response_model=BookingResponse)
def book_parcel_endpoint(payload: ParcelBookingRequest):
    try:
        tracking_id = create_parcel(payload.model_dump())
        return BookingResponse(tracking_id=tracking_id, message="Parcel booked successfully in MongoDB")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Booking failed: {str(e)}")

@router.get("/parcels")
def list_parcels_endpoint():
    try:
        return get_all_parcels()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tracking/{tracking_id}", response_model=TrackingResponse)
def get_tracking_endpoint(tracking_id: str):
    info = get_tracking_info(tracking_id)
    if not info:
        raise HTTPException(status_code=404, detail=f"Tracking ID {tracking_id} not found")
    return TrackingResponse(**info)

@router.post("/tracking/{tracking_id}/advance")
def advance_tracking_endpoint(tracking_id: str):
    next_stage = advance_tracking_stage(tracking_id)
    if next_stage is None:
        raise HTTPException(status_code=404, detail=f"Tracking ID {tracking_id} not found")
    return {"message": f"Parcel advanced to stage {next_stage}", "stage": next_stage}
