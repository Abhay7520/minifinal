from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

from app.services.tracking_service import (
    create_parcel,
    get_tracking_info,
    advance_tracking_stage,
    get_all_parcels,
    get_me_parcels_enriched,
    get_me_dashboard,
)

from app.services.category_service import predict_category_from_description
from app.services.pricing_service import calculate_pricing

from app.utils.jwt_auth import get_current_user_payload

router = APIRouter(tags=["Tracking & Booking"])

class PredictCategoryRequest(BaseModel):
    description: str

class PredictCategoryResponse(BaseModel):
    category: str
    confidence: float

class DimensionsInput(BaseModel):
    l: float
    w: float
    h: float

class CalculatePriceRequest(BaseModel):
    weight: float
    length: float
    width: float
    height: float
    parcel_type: str
    smart_options: List[str]
    insurance: str

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

    # New fields
    description: str
    ai_detected_category: str
    final_category: str
    confidence: float
    dimensions: DimensionsInput
    smart_options: List[str]

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


class AnomalyInfo(BaseModel):
    anomaly_id: str
    tracking_id: str
    anomaly_type: str
    severity: str
    created_at: str
    resolved: bool

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
    anomaly: Optional[AnomalyInfo] = None
    pickup_otp: Optional[str] = None
    delivery_otp: Optional[str] = None

@router.post("/parcels", response_model=BookingResponse)
def book_parcel_endpoint(
    payload: ParcelBookingRequest,
    user_payload: Dict[str, Any] = Depends(get_current_user_payload),
):
    try:
        tracking_id = create_parcel(payload.model_dump(), owner_payload=user_payload)
        return BookingResponse(tracking_id=tracking_id, message="Parcel booked successfully in MongoDB")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Booking failed: {str(e)}")


@router.get("/me/parcels")
def list_my_parcels_endpoint(
    user_payload: Dict[str, Any] = Depends(get_current_user_payload),
):
    try:
        return get_me_parcels_enriched(user_payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/me/dashboard")
def me_dashboard_endpoint(
    user_payload: Dict[str, Any] = Depends(get_current_user_payload),
):
    try:
        return get_me_dashboard(user_payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))






@router.get("/me/tracking/{tracking_id}", response_model=TrackingResponse)
def get_my_tracking_endpoint(
    tracking_id: str,
    user_payload: Dict[str, Any] = Depends(get_current_user_payload),
):
    from app.utils.mongo import db_service
    parcels_col = db_service.get_collection("parcels")
    parcel = parcels_col.find_one({"tracking_id": tracking_id})
    if not parcel:
        raise HTTPException(status_code=404, detail=f"Tracking ID {tracking_id} not found")

    expected_email = user_payload.get("sub")
    actual_email = parcel.get("owner_email")
    if expected_email and actual_email and actual_email != expected_email:
        raise HTTPException(status_code=403, detail="Access denied: You do not own this parcel")

    info = get_tracking_info(tracking_id, user_payload=user_payload)
    if not info:
        raise HTTPException(status_code=404, detail=f"Tracking ID {tracking_id} not found")
    return TrackingResponse(**info)



@router.post("/tracking/{tracking_id}/advance")
def advance_tracking_endpoint(
    tracking_id: str,
    user_payload: Dict[str, Any] = Depends(get_current_user_payload),
):
    from app.utils.mongo import db_service
    parcels_col = db_service.get_collection("parcels")
    parcel = parcels_col.find_one({"tracking_id": tracking_id})
    if not parcel:
        raise HTTPException(status_code=404, detail=f"Tracking ID {tracking_id} not found")

    expected_email = user_payload.get("sub")
    actual_email = parcel.get("owner_email")
    if expected_email and actual_email and actual_email != expected_email:
        raise HTTPException(status_code=403, detail="Access denied: You do not own this parcel")

    next_stage = advance_tracking_stage(tracking_id, user_payload=user_payload)
    if next_stage is None:
        raise HTTPException(status_code=404, detail=f"Tracking ID {tracking_id} not found")
    return {"message": f"Parcel advanced to stage {next_stage}", "stage": next_stage}


@router.post("/predict-category", response_model=PredictCategoryResponse)
def predict_category_endpoint(payload: PredictCategoryRequest):
    try:
        result = predict_category_from_description(payload.description)
        return PredictCategoryResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/calculate-price")
def calculate_price_endpoint(payload: CalculatePriceRequest):
    try:
        result = calculate_pricing(
            weight=payload.weight,
            length=payload.length,
            width=payload.width,
            height=payload.height,
            parcel_type=payload.parcel_type,
            smart_options=payload.smart_options,
            insurance=payload.insurance
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

