import datetime
import random
from typing import Dict, Any, List, Optional
from app.utils.mongo import db_service

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

def create_parcel(parcel_data: Dict[str, Any], owner_payload: Dict[str, Any] | None = None) -> str:
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
        "category": parcel_data.get("category", "other"),
        "time_slot": parcel_data.get("time_slot", "Anytime"),
        "insurance": parcel_data.get("insurance", "standard"),
        
        "distance_km": float(parcel_data.get("distance_km", 0.0)),
        "duration_hours": float(parcel_data.get("duration_hours", 0.0)),
        "duration_text": parcel_data.get("duration_text", "0 hrs"),
        "transit_days": parcel_data.get("transit_days", "Same day"),
        "route_coordinates": parcel_data.get("route_coordinates", []),
        
        "price_total": float(parcel_data.get("price_total", 0.0)),
        "created_at": created_at,
        "manual_stage_override": None,
        "delivery_otp": str(random.randint(1000, 9999)),
        "assigned_agent": "Rohan Sharma"
    }
    
    parcels_col.insert_one(parcel_doc)
    
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
    user_payload: Dict[str, Any] | None = None,
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

    parcels_col.update_one(
        {"tracking_id": tracking_id},
        {"$set": {"manual_stage_override": next_stage}},
    )
    return next_stage


def get_tracking_info(
    tracking_id: str,
    user_payload: Dict[str, Any] | None = None,
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
    elapsed_seconds = (now - created_at).total_seconds()
    
    # Calculate simulated stage index (0 to 6) based on elapsed time
    simulated_stage_index = int(elapsed_seconds // STAGE_DURATION_SECONDS)
    simulated_stage_index = min(6, simulated_stage_index) # max is Delivered (index 6)
    
    # Check if manual override exists and is higher
    manual_override = parcel.get("manual_stage_override")
    if manual_override is not None:
        # manual_override is 1-indexed (1 to 7)
        override_idx = int(manual_override) - 1
        current_stage_idx = max(simulated_stage_index, override_idx)
    else:
        current_stage_idx = simulated_stage_index
        
    current_stage = TRACKING_STAGES[current_stage_idx]
    
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
        # Calculate moving marker position
        time_fraction = (elapsed_seconds % STAGE_DURATION_SECONDS) / STAGE_DURATION_SECONDS
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
            "status": current_stage["status"],
            "progress_percentage": current_stage["progress"],
            "current_location_name": current_loc_name,
            "current_location_lat": current_lat,
            "current_location_lng": current_lng,
            "last_updated": now
        }},
        upsert=True
    )
    
    # Save newly reached milestones to tracking_history in MongoDB
    tracking_history_col = db_service.get_collection("tracking_history")
    for idx in range(current_stage_idx + 1):
        stage_info = TRACKING_STAGES[idx]
        # Check if already saved in history
        exists = tracking_history_col.find_one({"tracking_id": tracking_id, "status": stage_info["status"]})
        if not exists:
            # Simulate historical time for previous stages
            stage_time = created_at + datetime.timedelta(seconds=idx * STAGE_DURATION_SECONDS)
            # Cap at current time
            if stage_time > now:
                stage_time = now
            
            stage_loc = parcel["source_po"]
            if idx == 4:
                stage_loc = f"{parcel['dest_po'].split()[0]} Sorting Hub"
            elif idx == 5:
                stage_loc = parcel["dest_po"]
            elif idx == 6:
                stage_loc = "Recipient's Doorstep"
                
            tracking_history_col.insert_one({
                "tracking_id": tracking_id,
                "status": stage_info["status"],
                "timestamp": stage_time,
                "location": stage_loc,
                "details": stage_info["desc"]
            })
            
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
            "time": h["timestamp"].strftime("%Y-%m-%d %H:%M"),
            "location": h["location"],
            "details": h["details"],
            "done": True,
            "predicted": False
        })
        
    # 2. Add future predicted stages
    # Estimated arrival time: created_at + duration_hours
    predicted_arrival = created_at + datetime.timedelta(hours=parcel["duration_hours"])
    for idx, stage_info in enumerate(TRACKING_STAGES):
        if stage_info["status"] not in completed_statuses:
            # Calculate a mock prediction time based on remaining duration
            fraction = idx / 6.0
            predicted_time = created_at + datetime.timedelta(hours=parcel["duration_hours"] * fraction)
            if predicted_time < now:
                predicted_time = now + datetime.timedelta(minutes=15 * (idx - current_stage_idx))
                
            stage_loc = parcel["source_po"]
            if idx == 4:
                stage_loc = f"{parcel['dest_po'].split()[0]} Sorting Hub"
            elif idx == 5:
                stage_loc = parcel["dest_po"]
            elif idx == 6:
                stage_loc = "Recipient Address"

            timeline.append({
                "status": stage_info["status"],
                "time": f"Predicted: {predicted_time.strftime('%Y-%m-%d %H:%M')}",
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

    # Format estimated delivery
    est_delivery_date = predicted_arrival.strftime("%Y-%m-%d")

    return {
        "tracking_id": tracking_id,
        "current_status": current_stage["status"],
        "progress_percentage": current_stage["progress"],
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
        }
    }

def get_all_parcels() -> List[Dict[str, Any]]:
    parcels_col = db_service.get_collection("parcels")
    cursor = parcels_col.find().sort("created_at", -1)
    results = []
    for doc in cursor:
        doc["created_at"] = doc["created_at"].strftime("%Y-%m-%d %H:%M")
        # remove ObjectId if present
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
        results.append(doc)
    return results
