from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from app.services.staff_service import (
    get_assigned_deliveries,
    get_delivery_by_id,
    verify_delivery_otp,
    mark_delivery_failed,
    reattempt_delivery,
    log_delivery_action,
    get_staff_analytics,
    get_optimized_route,
    regenerate_otp
)

router = APIRouter(prefix="", tags=["Logistics Staff Dashboard"])

class OTPVerificationRequest(BaseModel):
    tracking_id: str = Field(..., description="The parcel tracking ID")
    otp: str = Field(..., description="4-digit verification code")

class FailureReportRequest(BaseModel):
    reason: str = Field(..., description="Reason for failure: customer unavailable, wrong address, refused delivery, etc.")

class ActionLogRequest(BaseModel):
    action_type: str = Field(..., description="Action type: call, sms, navigate")

@router.get("/staff/deliveries")
def get_deliveries_endpoint(agent_name: str = "Rohan Sharma"):
    try:
        return get_assigned_deliveries(agent_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/staff/delivery/{tracking_id}")
def get_delivery_endpoint(tracking_id: str):
    delivery = get_delivery_by_id(tracking_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery stop not found")
    return delivery

@router.post("/verify-delivery-otp")
def verify_otp_endpoint(payload: OTPVerificationRequest):
    result = verify_delivery_otp(payload.tracking_id, payload.otp)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result

@router.post("/staff/delivery/{tracking_id}/fail")
def report_failure_endpoint(tracking_id: str, payload: FailureReportRequest):
    result = mark_delivery_failed(tracking_id, payload.reason)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result

@router.post("/staff/delivery/{tracking_id}/reattempt")
def trigger_reattempt_endpoint(tracking_id: str):
    result = reattempt_delivery(tracking_id)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result

@router.post("/staff/delivery/{tracking_id}/action")
def log_action_endpoint(tracking_id: str, payload: ActionLogRequest):
    return log_delivery_action(tracking_id, payload.action_type)

@router.post("/staff/delivery/{tracking_id}/regenerate-otp")
def regenerate_otp_endpoint(tracking_id: str):
    result = regenerate_otp(tracking_id)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result

@router.get("/staff/analytics")
def get_analytics_endpoint(agent_name: str = "Rohan Sharma"):
    try:
        return get_staff_analytics(agent_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/staff/optimized-route")
def get_optimized_route_endpoint(agent_name: str = "Rohan Sharma"):
    try:
        return get_optimized_route(agent_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
