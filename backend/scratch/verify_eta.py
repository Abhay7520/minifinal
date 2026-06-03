import datetime
from app.utils.mongo import db_service
from app.services.tracking_service import create_parcel, get_tracking_info, get_me_dashboard, advance_tracking_stage

def verify():
    print("=== Running Programmatic ETA Verification ===")
    
    # 1. Prepare test parcel data
    test_user_email = "verify_eta_test@example.com"
    owner_payload = {"sub": test_user_email}
    
    parcel_data = {
        "sender_name": "Test Sender",
        "sender_phone": "+91 98765 43210",
        "source_address": "Test Source Address",
        "source_lat": 18.5204,
        "source_lng": 73.8567,
        "source_po": "Test Source PO",
        "receiver_name": "Test Receiver",
        "receiver_phone": "+91 91234 56789",
        "destination_address": "Test Dest Address",
        "dest_lat": 28.6139,
        "dest_lng": 77.2090,
        "dest_po": "Test Dest PO",
        "weight": 2.5,
        "parcel_type": "standard",
        "declared_value": 4500,
        "category": "electronics",
        "time_slot": "Anytime",
        "insurance": "standard",
        "distance_km": 1170.0,
        "duration_hours": 3.5, # 3.5 hours expected delivery corridor
        "duration_text": "3.5 hrs",
        "transit_days": "Same day",
        "route_coordinates": [[18.5204, 73.8567], [28.6139, 77.2090]]
    }
    
    # 2. Create the parcel
    tracking_id = create_parcel(parcel_data, owner_payload=owner_payload)
    print(f"Test parcel created. Tracking ID: {tracking_id}")
    
    # Retrieve parcel from DB
    parcels_col = db_service.get_collection("parcels")
    parcel = parcels_col.find_one({"tracking_id": tracking_id})
    created_at = parcel["created_at"]
    print(f"Parcel created_at (UTC): {created_at}")
    print(f"Storable ETA in DB: {parcel['eta']}")
    
    # 3. Retrieve tracking info
    info = get_tracking_info(tracking_id, user_payload=owner_payload)
    print(f"Estimated Delivery formatted: {info['estimated_delivery']}")
    
    # 4. Fetch dashboard details
    dashboard = get_me_dashboard(owner_payload)
    print(f"Dashboard nextEta: '{dashboard['nextEta']}'")
    
    # 5. Advance stage (Picked Up)
    advance_tracking_stage(tracking_id)
    info_stage2 = get_tracking_info(tracking_id, user_payload=owner_payload)
    print(f"After Stage 2 advance - Estimated Delivery: {info_stage2['estimated_delivery']}")
    
    # 6. Check assertions/validations
    # Calculate expected IST arrival time
    from app.services.tracking_service import to_ist
    expected_ist_arrival = to_ist(created_at + datetime.timedelta(hours=3.5))
    expected_formatted = expected_ist_arrival.strftime("%d %b %Y, %I:%M %p")
    expected_date_str = expected_ist_arrival.strftime("%Y-%m-%d")
    
    print("\n=== Validation Check ===")
    print(f"Expected Formatted (IST): {expected_formatted}")
    print(f"Actual Formatted (IST):   {info['estimated_delivery']}")
    print(f"Expected Date string:      {expected_date_str}")
    print(f"Actual Dashboard nextEta:  {dashboard['nextEta']}")
    
    success = True
    if info['estimated_delivery'] != expected_formatted:
        print("[-] FAILED: Estimated delivery time formatting or calculation does not match!")
        success = False
    else:
        print("[+] SUCCESS: Estimated delivery formatted correctly in IST!")
        
    if dashboard['nextEta'] != expected_date_str:
        print("[-] FAILED: Dashboard nextEta parsing failed!")
        success = False
    else:
        print("[+] SUCCESS: Dashboard nextEta parsed correctly!")
        
    # Clean up test parcel
    db_service.get_collection("parcels").delete_one({"tracking_id": tracking_id})
    db_service.get_collection("shipment_status").delete_one({"tracking_id": tracking_id})
    db_service.get_collection("tracking_history").delete_many({"tracking_id": tracking_id})
    db_service.get_collection("risk_predictions").delete_one({"tracking_id": tracking_id})
    db_service.get_collection("anomaly_logs").delete_one({"tracking_id": tracking_id})
    db_service.get_collection("route_history").delete_one({"tracking_id": tracking_id})
    print("\nCleanup completed.")
    
    if success:
        print("\n*** ALL TESTS PASSED SUCCESSFULLY! ***")
    else:
        print("\n*** SOME TESTS FAILED! ***")

if __name__ == "__main__":
    verify()
