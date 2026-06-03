import datetime
import random
from typing import Dict, Any, List, Optional
from app.utils.mongo import db_service

IST = datetime.timezone(datetime.timedelta(hours=5, minutes=30))

def to_ist(dt: datetime.datetime) -> datetime.datetime:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=datetime.timezone.utc)
    return dt.astimezone(IST)

TRACKING_STAGES = [
    {"stage": 1, "status": "Parcel Booked", "progress": 5, "desc": "Shipment booked and registered on AIPOSTAL AI platform."},
    {"stage": 2, "status": "Picked Up", "progress": 20, "desc": "Pickup agent collected the package and verified details."},
    {"stage": 3, "status": "At Source Post Office", "progress": 35, "desc": "Parcel arrived at source post office for sorting."},
    {"stage": 4, "status": "In Transit", "progress": 55, "desc": "Parcel is in transit via road transport corridor."},
    {"stage": 5, "status": "At Sorting Hub", "progress": 75, "desc": "Arrived at regional AI sorting hub for sorting and routing."},
    {"stage": 6, "status": "Out for Delivery", "progress": 90, "desc": "Package out for local delivery with delivery agent."},
    {"stage": 7, "status": "Delivered", "progress": 100, "desc": "Shipment delivered successfully. Thank you for using AIPOSTAL!"}
]

STAGE_DURATION_SECONDS = 25 # Each stage takes 25 seconds in simulation mode

def generate_tracking_id() -> str:
    # E.g., AIP + 6 random digits
    return f"AIP{random.randint(100000, 999999)}"

def create_parcel(parcel_data: Dict[str, Any], owner_payload: Optional[Dict[str, Any]] = None) -> str:
    tracking_id = generate_tracking_id()

    # Save the base parcel
    parcels_col = db_service.get_collection("parcels")
    created_at = datetime.datetime.now(datetime.timezone.utc)

    owner_id = None
    owner_email = None
    if owner_payload:
        # Existing JWT uses `sub` as the email
        owner_email = owner_payload.get("sub")
        owner_id = owner_payload.get("sub")

    duration_hours = float(parcel_data.get("duration_hours", 2.0))
    eta_dt = created_at + datetime.timedelta(hours=duration_hours)
    eta_str = to_ist(eta_dt).strftime("%Y-%m-%d")

    from app.services.pricing_service import calculate_pricing
    dims = parcel_data.get("dimensions", {"l": 30.0, "w": 20.0, "h": 15.0})
    smart_opts = parcel_data.get("smart_options", [])
    pricing_breakdown = calculate_pricing(
        weight=float(parcel_data.get("weight", 1.0)),
        length=float(dims.get("l", 30.0)),
        width=float(dims.get("w", 20.0)),
        height=float(dims.get("h", 15.0)),
        parcel_type=parcel_data.get("parcel_type", "standard"),
        smart_options=smart_opts,
        insurance=parcel_data.get("insurance", "standard")
    )

    parcel_doc = {"owner_id": owner_id, "owner_email": owner_email,
        "tracking_id": tracking_id,
        "sender_name": parcel_data.get("sender_name", "John Doe"),
        "sender_phone": parcel_data.get("sender_phone", "+91 98765 43210"),
        "source_address": parcel_data.get("source_address", ""),
        "source_lat": float(parcel_data.get("source_lat", 0.0)),
        "source_lng": float(parcel_data.get("source_lng", 0.0)),
        "source_po": parcel_data.get("source_po", "Source PO"),
        
        "receiver_name": parcel_data.get("receiver_name", "Priya Mehta"),
        "receiver_phone": parcel_data.get("receiver_phone", "+91 91234 56789"),
        "destination_address": parcel_data.get("destination_address", ""),
        "dest_lat": float(parcel_data.get("dest_lat", 0.0)),
        "dest_lng": float(parcel_data.get("dest_lng", 0.0)),
        "dest_po": parcel_data.get("dest_po", "Destination PO"),
        
        "weight": float(parcel_data.get("weight", 1.0)),
        "parcel_type": parcel_data.get("parcel_type", "standard"),
        "declared_value": float(parcel_data.get("declared_value", 0.0)),
        "category": parcel_data.get("final_category", parcel_data.get("category", "other")),
        "time_slot": parcel_data.get("time_slot", "Anytime"),
        "insurance": parcel_data.get("insurance", "standard"),
        
        "distance_km": float(parcel_data.get("distance_km", 0.0)),
        "duration_hours": duration_hours,
        "duration_text": parcel_data.get("duration_text", "0 hrs"),
        "transit_days": parcel_data.get("transit_days", "Same day"),
        "route_coordinates": parcel_data.get("route_coordinates", []),
        
        "price_total": pricing_breakdown["total"],
        "pricing_breakdown": pricing_breakdown,
        "created_at": created_at,
        "eta": eta_str,
        "manual_stage_override": None,
        "delivery_otp": str(random.randint(1000, 9999)),
        "assigned_agent": "Rohan Sharma",
        
        # New Category fields
        "description": parcel_data.get("description", ""),
        "ai_detected_category": parcel_data.get("ai_detected_category", "other"),
        "final_category": parcel_data.get("final_category", "other"),
        "confidence": float(parcel_data.get("confidence", 0.0)),
        "dimensions": dims,
        "smart_options": smart_opts
    }
    
    parcels_col.insert_one(parcel_doc)
    
    # Generate Pickup OTP
    from app.services.otp_service import generate_otp
    generate_otp(tracking_id, "pickup")
    
    # Save default route in route_history
    route_history_col = db_service.get_collection("route_history")
    route_history_col.insert_one({
        "tracking_id": tracking_id,
        "coordinates": parcel_data.get("route_coordinates", []),
        "created_at": created_at
    })
    
    # Predict and save Delay Risk
    from app.services.risk_service import get_delay_risk_prediction
    risk_res = get_delay_risk_prediction({
        "distance_km": parcel_doc["distance_km"],
        "weight": parcel_doc["weight"],
        "parcel_type": parcel_doc["parcel_type"],
        "weather": parcel_data.get("weather", "Clear"),
        "congestion": parcel_data.get("congestion", "Low")
    })
    
    risk_predictions_col = db_service.get_collection("risk_predictions")
    risk_predictions_col.insert_one({
        "tracking_id": tracking_id,
        "risk_level": risk_res["risk_level"],
        "risk_score": risk_res["risk_score"],
        "risk_factors": risk_res["risk_factors"],
        "recommendation": risk_res["recommendation"],
        "created_at": created_at
    })
    
    # Create initial shipment status
    shipment_status_col = db_service.get_collection("shipment_status")
    shipment_status_col.insert_one({
        "tracking_id": tracking_id,
        "status": "Parcel Booked",
        "progress_percentage": 5,
        "current_location_name": parcel_doc["source_po"],
        "current_location_lat": parcel_doc["source_lat"],
        "current_location_lng": parcel_doc["source_lng"],
        "last_updated": created_at
    })
    
    # Insert initial tracking history event
    tracking_history_col = db_service.get_collection("tracking_history")
    tracking_history_col.insert_one({
        "tracking_id": tracking_id,
        "status": "Parcel Booked",
        "timestamp": created_at,
        "location": parcel_doc["source_po"],
        "details": TRACKING_STAGES[0]["desc"]
    })
    
    # Save placeholder anomaly log
    anomaly_logs_col = db_service.get_collection("anomaly_logs")
    anomaly_logs_col.insert_one({
        "tracking_id": tracking_id,
        "anomaly_detected": False,
        "anomaly_score": 0.12,
        "issue_type": "None",
        "severity": "Green",
        "recommendation": "Package moving normally.",
        "created_at": created_at
    })
    
    return tracking_id

def advance_tracking_stage(
    tracking_id: str,
    user_payload: Optional[Dict[str, Any]] = None,
) -> Optional[int]:
    parcels_col = db_service.get_collection("parcels")

    parcel = parcels_col.find_one({"tracking_id": tracking_id})
    if not parcel:
        return None

    # Ownership check (if JWT payload is provided)
    if user_payload is not None:
        expected_email = user_payload.get("sub")
        actual_email = parcel.get("owner_email")
        if expected_email and actual_email and actual_email != expected_email:
            return None

    current_override = parcel.get("manual_stage_override")
    if current_override is None:
        # We start overrides from stage 2 (since stage 1 is Booked)
        next_stage = 2
    else:
        next_stage = min(7, int(current_override) + 1)

    now = datetime.datetime.now(datetime.timezone.utc)
    duration_hours = float(parcel.get("duration_hours", 2.0))
    created_at = parcel.get("created_at")
    if created_at:
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=datetime.timezone.utc)
    else:
        created_at = now

    if next_stage in (6, 7):
        new_eta = to_ist(now).strftime("%Y-%m-%d")
    else:
        new_eta = to_ist(created_at + datetime.timedelta(hours=duration_hours)).strftime("%Y-%m-%d")

    parcels_col.update_one(
        {"tracking_id": tracking_id},
        {"$set": {"manual_stage_override": next_stage, "eta": new_eta}},
    )

    # Insert milestone into tracking history directly
    tracking_history_col = db_service.get_collection("tracking_history")
    stage_idx = next_stage - 1
    if 0 <= stage_idx < len(TRACKING_STAGES):
        stage_info = TRACKING_STAGES[stage_idx]
        exists = tracking_history_col.find_one({"tracking_id": tracking_id, "status": stage_info["status"]})
        if not exists:
            stage_loc = parcel.get("source_po", "Source PO")
            if stage_idx == 4:
                stage_loc = f"{parcel.get('dest_po', 'Destination PO').split()[0]} Sorting Hub"
            elif stage_idx == 5:
                stage_loc = parcel.get("dest_po", "Destination PO")
            elif stage_idx == 6:
                stage_loc = "Recipient's Doorstep"
                
            tracking_history_col.insert_one({
                "tracking_id": tracking_id,
                "status": stage_info["status"],
                "timestamp": now,
                "location": stage_loc,
                "details": stage_info["desc"]
            })

    if next_stage == 6:
        from app.services.otp_service import generate_otp
        delivery_otp = generate_otp(tracking_id, "delivery")
        
        # Create user notification in notifications collection
        notifications_col = db_service.get_collection("notifications")
        import random
        not_id = f"NOT{random.randint(100000, 999999)}"
        notifications_col.insert_one({
            "notification_id": not_id,
            "user_id": parcel.get("owner_id"),
            "user_email": parcel.get("owner_email"),
            "tracking_id": tracking_id,
            "title": "Delivery OTP Notification",
            "message": f"Your parcel {tracking_id} is out for delivery. Please share OTP code {delivery_otp} with the delivery agent.",
            "type": "delivery_otp",
            "created_at": now,
            "read": False
        })

    return next_stage


def get_tracking_info(
    tracking_id: str,
    user_payload: Optional[Dict[str, Any]] = None,
) -> Optional[Dict[str, Any]]:
    parcels_col = db_service.get_collection("parcels")
    parcel = parcels_col.find_one({"tracking_id": tracking_id})
    if not parcel:
        return None

    # Ownership check (if JWT payload is provided)
    if user_payload is not None:
        expected_email = user_payload.get("sub")
        actual_email = parcel.get("owner_email")
        if expected_email and actual_email and actual_email != expected_email:
            return None

    created_at = parcel["created_at"]

    # Ensure timezone aware comparison
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=datetime.timezone.utc)
    
    now = datetime.datetime.now(datetime.timezone.utc)
    
    # Check manual override (disable time-based auto-progress)
    manual_override = parcel.get("manual_stage_override")
    is_failed = (manual_override == -1)
    
    if manual_override is not None:
        if is_failed:
            current_stage_idx = 3  # In Transit (index 3) when failed
        else:
            current_stage_idx = int(manual_override) - 1
    else:
        current_stage_idx = 0  # Default to Stage 1 (index 0, i.e., "Parcel Booked")
        
    current_stage = TRACKING_STAGES[current_stage_idx]
    current_status = "Delivery Failed" if is_failed else current_stage["status"]
    current_progress = 55 if is_failed else current_stage["progress"]

    # Calculate latest ETA based on current status/override and update MongoDB
    duration_hours = float(parcel.get("duration_hours", 2.0))
    if current_stage_idx == 6: # Delivered
        calculated_eta = to_ist(now).strftime("%Y-%m-%d")
    elif current_stage_idx == 5: # Out for Delivery
        calculated_eta = to_ist(now).strftime("%Y-%m-%d")
    elif is_failed: # Failed
        calculated_eta = to_ist(created_at + datetime.timedelta(hours=duration_hours + 24.0)).strftime("%Y-%m-%d")
    else:
        calculated_eta = to_ist(created_at + datetime.timedelta(hours=duration_hours)).strftime("%Y-%m-%d")

    current_eta = parcel.get("eta")
    if current_eta != calculated_eta:
        parcels_col.update_one({"tracking_id": tracking_id}, {"$set": {"eta": calculated_eta}})
        parcel["eta"] = calculated_eta
    
    # Extract route details
    route_coords = parcel.get("route_coordinates", [])
    if not route_coords:
        route_coords = [[parcel["source_lat"], parcel["source_lng"]], [parcel["dest_lat"], parcel["dest_lng"]]]
        
    # Calculate current location coordinates based on current stage
    current_lat = parcel["source_lat"]
    current_lng = parcel["source_lng"]
    current_loc_name = parcel["source_po"]
    
    if current_stage_idx == 0: # Booked
        current_lat, current_lng = route_coords[0]
        current_loc_name = f"Registered at {parcel['source_po']}"
    elif current_stage_idx == 1: # Picked Up
        current_lat, current_lng = route_coords[0]
        current_loc_name = f"Picked Up near {parcel['source_po']}"
    elif current_stage_idx == 2: # At Source PO
        current_lat, current_lng = route_coords[0]
        current_loc_name = parcel["source_po"]
    elif current_stage_idx == 3: # In Transit
        # Moving along route coordinate points
        # Calculate moving marker position using static 0.5 fraction (auto-progression disabled)
        time_fraction = 0.5
        coord_idx = int(time_fraction * len(route_coords))
        coord_idx = min(len(route_coords) - 1, max(0, coord_idx))
        current_lat, current_lng = route_coords[coord_idx]
        current_loc_name = f"In Transit - Highway segment {coord_idx + 1}"
    elif current_stage_idx == 4: # At Sorting Hub
        mid_idx = len(route_coords) // 2
        current_lat, current_lng = route_coords[mid_idx]
        current_loc_name = f"{parcel['dest_po'].split()[0]} Regional Sorting Hub"
    elif current_stage_idx == 5: # Out for Delivery
        near_end_idx = max(0, len(route_coords) - 2)
        current_lat, current_lng = route_coords[near_end_idx]
        current_loc_name = f"Out for Delivery from {parcel['dest_po']}"
    elif current_stage_idx == 6: # Delivered
        current_lat, current_lng = route_coords[-1]
        current_loc_name = "Delivered at Destination"

    # Update shipment status collection in MongoDB
    shipment_status_col = db_service.get_collection("shipment_status")
    shipment_status_col.update_one(
        {"tracking_id": tracking_id},
        {"$set": {
            "status": current_status,
            "progress_percentage": current_progress,
            "current_location_name": current_loc_name,
            "current_location_lat": current_lat,
            "current_location_lng": current_lng,
            "last_updated": now
        }},
        upsert=True
    )
    
    # We no longer automatically populate tracking_history with simulated timestamps in a loop.
    # History milestones are now recorded directly inside advance_tracking_stage.
    tracking_history_col = db_service.get_collection("tracking_history")
            
    # Fetch all history from MongoDB
    history_cursor = tracking_history_col.find({"tracking_id": tracking_id}).sort("timestamp", 1)
    history_events = list(history_cursor)
    
    # Build complete timeline: both completed milestones AND future predicted ones
    timeline = []
    # 1. Add completed milestones with real history timestamps
    completed_statuses = set()
    for h in history_events:
        completed_statuses.add(h["status"])
        timeline.append({
            "status": h["status"],
            "time": to_ist(h["timestamp"]).strftime("%d %b %Y, %I:%M %p"),
            "location": h["location"],
            "details": h["details"],
            "done": True,
            "predicted": False
        })
        
    # 2. Add future predicted stages
    # Estimated arrival time based on calculated_eta
    if current_stage_idx == 6: # Delivered
        delivered_event = next((h for h in history_events if h["status"] == "Delivered"), None)
        if delivered_event:
            predicted_arrival = to_ist(delivered_event["timestamp"])
        else:
            predicted_arrival = to_ist(now)
    else:
        try:
            parsed_eta = datetime.datetime.strptime(calculated_eta, "%Y-%m-%d")
            expected_arrival_dt = to_ist(created_at + datetime.timedelta(hours=duration_hours))
            predicted_arrival = parsed_eta.replace(
                hour=expected_arrival_dt.hour,
                minute=expected_arrival_dt.minute,
                second=expected_arrival_dt.second,
                microsecond=0,
                tzinfo=IST
            )
        except Exception:
            predicted_arrival = to_ist(created_at + datetime.timedelta(hours=parcel.get("duration_hours", 2.0)))
        
    num_remaining = 6 - current_stage_idx
    time_to_arrival = predicted_arrival - to_ist(now)
    
    for idx, stage_info in enumerate(TRACKING_STAGES):
        if stage_info["status"] not in completed_statuses:
            if num_remaining > 0 and time_to_arrival.total_seconds() > 0:
                fraction = (idx - current_stage_idx) / num_remaining
                predicted_time = to_ist(now) + datetime.timedelta(seconds=time_to_arrival.total_seconds() * fraction)
            else:
                predicted_time = to_ist(now) + datetime.timedelta(minutes=30 * (idx - current_stage_idx))
                
            stage_loc = parcel["source_po"]
            if idx == 4:
                stage_loc = f"{parcel['dest_po'].split()[0]} Sorting Hub"
            elif idx == 5:
                stage_loc = parcel["dest_po"]
            elif idx == 6:
                stage_loc = "Recipient Address"

            timeline.append({
                "status": stage_info["status"],
                "time": f"Predicted: {predicted_time.strftime('%d %b %Y, %I:%M %p')}",
                "location": stage_loc,
                "details": stage_info["desc"],
                "done": False,
                "predicted": True
            })

    # Get delay risk information
    risk_col = db_service.get_collection("risk_predictions")
    risk = risk_col.find_one({"tracking_id": tracking_id})
    risk_info = {
        "risk_level": risk["risk_level"] if risk else "Low",
        "risk_score": risk["risk_score"] if risk else 0.1,
        "risk_factors": risk["risk_factors"] if risk else ["Route within normal parameters"],
        "recommendation": risk["recommendation"] if risk else "No special handling required"
    }

    # Format estimated delivery (Clean formatted timestamp with 18:00 delivery hour)
    est_delivery_date = predicted_arrival.strftime("%d %b %Y, %I:%M %p")

    # AI Delay Detection Check
    # Condition: Current Date > ETA AND Status != Delivered
    active_anomaly_doc = None
    if current_status != "Delivered":
        current_date_str = now.strftime("%Y-%m-%d")
        if current_date_str > calculated_eta:
            anomalies_col = db_service.get_collection("anomalies")
            existing_anomaly = anomalies_col.find_one({"tracking_id": tracking_id, "resolved": False})
            if existing_anomaly:
                active_anomaly_doc = existing_anomaly
            else:
                anm_id = f"ANM{random.randint(100000, 999999)}"
                new_anomaly = {
                    "anomaly_id": anm_id,
                    "tracking_id": tracking_id,
                    "anomaly_type": "Delay",
                    "severity": "High",
                    "created_at": now,
                    "resolved": False
                }
                anomalies_col.insert_one(new_anomaly)
                active_anomaly_doc = new_anomaly
                
                # Create user notification in notifications collection
                notifications_col = db_service.get_collection("notifications")
                not_id = f"NOT{random.randint(100000, 999999)}"
                notifications_col.insert_one({
                    "notification_id": not_id,
                    "user_id": parcel.get("owner_id"),
                    "user_email": parcel.get("owner_email"),
                    "tracking_id": tracking_id,
                    "title": "Shipment Delay Alert",
                    "message": f"Parcel {tracking_id} has exceeded its estimated delivery date ({calculated_eta}). AI models predict a delivery delay.",
                    "type": "delay_anomaly",
                    "created_at": now,
                    "read": False
                })
    else:
        # Resolve anomalies if status is Delivered
        anomalies_col = db_service.get_collection("anomalies")
        anomalies_col.update_many({"tracking_id": tracking_id, "resolved": False}, {"$set": {"resolved": True}})

    anomaly_data = None
    if active_anomaly_doc:
        anomaly_data = {
            "anomaly_id": active_anomaly_doc["anomaly_id"],
            "tracking_id": active_anomaly_doc["tracking_id"],
            "anomaly_type": active_anomaly_doc["anomaly_type"],
            "severity": active_anomaly_doc["severity"],
            "created_at": active_anomaly_doc["created_at"].isoformat() if isinstance(active_anomaly_doc["created_at"], datetime.datetime) else str(active_anomaly_doc["created_at"]),
            "resolved": active_anomaly_doc["resolved"]
        }

    # Generate Delivery OTP if current stage is Out for Delivery (index 5) and none exists
    if current_stage_idx == 5:
        from app.services.otp_service import generate_otp
        otps_col = db_service.get_collection("otps")
        existing_otp = otps_col.find_one({"tracking_id": tracking_id, "otp_type": "delivery", "verified": False})
        if not existing_otp:
            delivery_otp_code = generate_otp(tracking_id, "delivery")
            
            # Create user notification in notifications collection
            notifications_col = db_service.get_collection("notifications")
            import random
            not_id = f"NOT{random.randint(100000, 999999)}"
            notifications_col.insert_one({
                "notification_id": not_id,
                "user_id": parcel.get("owner_id"),
                "user_email": parcel.get("owner_email"),
                "tracking_id": tracking_id,
                "title": "Delivery OTP Notification",
                "message": f"Your parcel {tracking_id} is out for delivery. Please share OTP code {delivery_otp_code} with the delivery agent.",
                "type": "delivery_otp",
                "created_at": now,
                "read": False
            })

    # Retrieve active unverified OTPs from database to show to the user
    otps_col = db_service.get_collection("otps")
    pickup_record = otps_col.find_one({"tracking_id": tracking_id, "otp_type": "pickup", "verified": False})
    delivery_record = otps_col.find_one({"tracking_id": tracking_id, "otp_type": "delivery", "verified": False})
    
    pickup_otp_code = pickup_record["otp_code"] if pickup_record else parcel.get("pickup_otp")
    delivery_otp_code = delivery_record["otp_code"] if delivery_record else parcel.get("delivery_otp")

    return {
        "tracking_id": tracking_id,
        "current_status": current_status,
        "progress_percentage": current_progress,
        "current_location": current_loc_name,
        "current_lat": current_lat,
        "current_lng": current_lng,
        "estimated_delivery": est_delivery_date,
        "timeline": timeline,
        "risk_info": risk_info,
        "parcel_details": {
            "source_address": parcel["source_address"],
            "destination_address": parcel["destination_address"],
            "sender_name": parcel["sender_name"],
            "receiver_name": parcel["receiver_name"],
            "weight": parcel["weight"],
            "parcel_type": parcel["parcel_type"],
            "price_total": parcel["price_total"],
            "source_lat": parcel["source_lat"],
            "source_lng": parcel["source_lng"],
            "dest_lat": parcel["dest_lat"],
            "dest_lng": parcel["dest_lng"],
            "route_coordinates": route_coords
        },
        "anomaly": anomaly_data,
        "pickup_otp": pickup_otp_code,
        "delivery_otp": delivery_otp_code
    }

def _derive_parcel_status(current_status: str, estimated_delivery_str: str, delivered_status_name: str = "Delivered") -> str:
    if current_status == delivered_status_name:
        return "Delivered"
    if current_status in ("Returned", "Delivery Failed", "Failed"):
        return "Returned"

    # delayed if ETA date is in the past (and not delivered)
    local_now_date = to_ist(datetime.datetime.now(datetime.timezone.utc)).date()
    try:
        # Try new format first
        eta_date = datetime.datetime.strptime(estimated_delivery_str, "%d %b %Y, %I:%M %p").date()
        if eta_date < local_now_date:
            return "Delayed"
    except Exception:
        try:
            eta_date = datetime.datetime.strptime(estimated_delivery_str, "%Y-%m-%d").date()
            if eta_date < local_now_date:
                return "Delayed"
        except Exception:
            pass

    # everything else is active
    return "Active"


def _parse_datetime_from_mongo(value: Any) -> datetime.datetime:
    if isinstance(value, datetime.datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=datetime.timezone.utc)
        return value
    # Fallback: try parsing string
    if isinstance(value, str):
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"):
            try:
                dt = datetime.datetime.strptime(value, fmt)
                return dt.replace(tzinfo=datetime.timezone.utc)
            except Exception:
                continue
    return datetime.datetime.now(datetime.timezone.utc)


def get_me_parcels_enriched(user_payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    email = user_payload.get("sub")
    if not email:
        return []

    parcels = get_all_parcels()
    my_parcels = [p for p in parcels if p.get("owner_email") == email]

    enriched: List[Dict[str, Any]] = []
    for p in my_parcels:
        tracking_id = p.get("tracking_id")
        if not tracking_id:
            continue

        # Compute lifecycle from existing backend logic.
        info = get_tracking_info(tracking_id, user_payload=user_payload)
        if not info:
            continue

        estimated_delivery = info.get("estimated_delivery")
        current_status = info.get("current_status")
        lifecycle_status = _derive_parcel_status(current_status, estimated_delivery)

        created_at_dt = _parse_datetime_from_mongo(p.get("created_at"))
        created_at_str = created_at_dt.isoformat()

        delivered_date = None
        # If timeline has Delivered event, use its timestamp (done milestone)
        try:
            delivered_events = [
                t for t in info.get("timeline", [])
                if t.get("done") and t.get("status") == "Delivered"
            ]
            if delivered_events:
                delivered_date = delivered_events[-1].get("time", None)
                # time is either ISO-like or formatted; keep as string for frontend.
        except Exception:
            delivered_date = None

        eta_value = estimated_delivery
        if eta_value is None:
            eta_value = ""

        enriched.append({
            "tracking_id": tracking_id,
            "status": lifecycle_status,
            "created_at": created_at_str,
            "eta": p.get("eta", ""),
            "estimated_delivery": eta_value,
            "parcel_type": p.get("parcel_type", "standard"),
            "delivery_date": delivered_date,
            "sender_name": p.get("sender_name", ""),
            "receiver_name": p.get("receiver_name", ""),
            "source_address": p.get("source_address", ""),
            "destination_address": p.get("destination_address", ""),
        })

    # sort newest first
    enriched.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return enriched


def get_me_dashboard(user_payload: Dict[str, Any]) -> Dict[str, Any]:
    parcels = get_me_parcels_enriched(user_payload)
    now = datetime.datetime.now(datetime.timezone.utc)

    active = [p for p in parcels if p.get("status") in {"Active"}]
    delivered = [p for p in parcels if p.get("status") in {"Delivered"}]
    delayed = [p for p in parcels if p.get("status") in {"Delayed"}]
    returned = [p for p in parcels if p.get("status") in {"Returned"}]

    # Weekly activity: last 7 days counts by created_at day (real records)
    start_date = (now - datetime.timedelta(days=6)).date()
    days = [(start_date + datetime.timedelta(days=i)) for i in range(7)]
    day_labels = [d.strftime("%a") for d in days]
    day_map = {d.strftime("%a"): 0 for d in days}

    for p in parcels:
        try:
            dt = datetime.datetime.fromisoformat(p["created_at"])
            day = dt.astimezone(datetime.timezone.utc).date()
            if start_date <= day <= now.date():
                day_map[day.strftime("%a")] += 1
        except Exception:
            continue

    weekly_activity = [{"day": label, "parcels": day_map.get(label, 0)} for label in day_labels]

    # Monthly overview: current month counts of sent vs received.
    first_day = now.replace(day=1).date()
    next_month = (first_day.replace(day=28) + datetime.timedelta(days=4)).replace(day=1)
    this_month_label = first_day.strftime("%b")

    sent_count = 0
    received_count = 0
    for p in parcels:
        # sent by created_at in current month
        try:
            dt = datetime.datetime.fromisoformat(p["created_at"])
            day = dt.astimezone(datetime.timezone.utc).date()
            if first_day <= day < next_month:
                sent_count += 1
        except Exception:
            pass

        # received/delivered by status delivered in current month only
        if p.get("status") == "Delivered":
            delivered_in_month = False
            if p.get("delivery_date"):
                try:
                    # delivery_date is formatted as YYYY-MM-DD HH:MM or similar
                    ddt = datetime.datetime.strptime(p["delivery_date"], "%Y-%m-%d %H:%M")
                    dday = ddt.date()
                    if first_day <= dday < next_month:
                        delivered_in_month = True
                except Exception:
                    pass
            if not delivered_in_month:
                # fallback: check created_at if delivery_date parsing fails/is null
                try:
                    dt = datetime.datetime.fromisoformat(p["created_at"])
                    day = dt.astimezone(datetime.timezone.utc).date()
                    if first_day <= day < next_month:
                        delivered_in_month = True
                except Exception:
                    pass
            if delivered_in_month:
                received_count += 1

    monthly_overview = [{"month": this_month_label, "sent": sent_count, "received": received_count}]

    # nextEta: next active parcel ETA (smallest future eta)
    def eta_to_date(eta: Any) -> Optional[datetime.date]:
        if not eta:
            return None
        if isinstance(eta, str):
            for fmt in ("%d %b %Y, %I:%M %p", "%Y-%m-%d"):
                try:
                    return datetime.datetime.strptime(eta, fmt).date()
                except Exception:
                    continue
        return None

    active_with_eta = []
    for p in active:
        d = eta_to_date(p.get("eta"))
        if d:
            active_with_eta.append((d, p))

    local_now = to_ist(now)
    future_items = [(d, p) for d, p in active_with_eta if d >= local_now.date()]
    if future_items:
        future_items.sort(key=lambda x: x[0])
        next_eta_date = future_items[0][0]
        next_eta = next_eta_date.strftime("%Y-%m-%d")
    else:
        # if no future eta, return earliest active eta as fallback but still real-derived
        if active_with_eta:
            active_with_eta.sort(key=lambda x: x[0])
            next_eta = active_with_eta[0][0].strftime("%Y-%m-%d")
        else:
            next_eta = ""

    # Fetch alerts (unresolved anomalies) for user's parcels
    my_tracking_ids = [p["tracking_id"] for p in parcels if p.get("tracking_id")]
    anomalies_col = db_service.get_collection("anomalies")
    unresolved_anomalies = list(anomalies_col.find({"tracking_id": {"$in": my_tracking_ids}, "resolved": False}))
    
    alerts = []
    for ua in unresolved_anomalies:
        matching_parcel = next((p for p in parcels if p["tracking_id"] == ua["tracking_id"]), None)
        alerts.append({
            "anomaly_id": ua.get("anomaly_id"),
            "tracking_id": ua.get("tracking_id"),
            "anomaly_type": ua.get("anomaly_type"),
            "severity": ua.get("severity"),
            "created_at": ua.get("created_at").isoformat() if isinstance(ua.get("created_at"), datetime.datetime) else str(ua.get("created_at")),
            "resolved": ua.get("resolved"),
            "eta": matching_parcel.get("eta") if matching_parcel else ""
        })

    return {
        "activeParcels": len(active),
        "deliveredParcels": len(delivered),
        "delayedParcels": len(delayed),
        "returnedParcels": len(returned),
        "weeklyActivity": weekly_activity,
        "monthlyOverview": monthly_overview,
        "nextEta": next_eta,
        "alerts": alerts,
    }


def get_all_parcels() -> List[Dict[str, Any]]:
    parcels_col = db_service.get_collection("parcels")
    cursor = parcels_col.find().sort("created_at", -1)
    results = []
    for doc in cursor:
        doc["created_at"] = to_ist(doc["created_at"]).strftime("%Y-%m-%d %H:%M")
        # remove ObjectId if present
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
        results.append(doc)
    return results

