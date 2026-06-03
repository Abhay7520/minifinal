from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes.address import router as address_router
from app.routes.eta import router as eta_router
from app.routes.risk import router as risk_router
from app.routes.tracking import router as tracking_router
from app.routes.anomaly import router as anomaly_router
from app.routes.staff import router as staff_router
from app.services.data_loader import data_store
from app.services.eta_service import ensure_model_trained
from app.services.risk_service import ensure_risk_model_trained
from app.services.anomaly_service import ensure_anomaly_model_trained
from app.utils.mongo import db_service


@asynccontextmanager
async def lifespan(_app: FastAPI):
    data_store.load()
    db_service.connect()
    # Backfill migration: ensure all parcels have an owner_id and owner_email
    try:
        parcels_col = db_service.get_collection("parcels")
        res = parcels_col.update_many(
            {"$or": [{"owner_email": None}, {"owner_email": {"$exists": False}}]},
            {"$set": {"owner_email": "demo@aipostal.com", "owner_id": "demo@aipostal.com"}}
        )
        print(f"Backfill migration: updated {res.modified_count} parcels with default owner 'demo@aipostal.com'")

        # Backfill migration: ensure sender and receiver names are unique and distinct
        try:
            import hashlib
            MIGRATION_COMBINATIONS = [
                {
                    "sender_name": "Amit Patel",
                    "sender_phone": "+91 98765 43210",
                    "source_address": "42, MG Road, Pune, Maharashtra - 411001",
                    "source_lat": 18.5204,
                    "source_lng": 73.8567,
                    "source_po": "Pune GPO",
                    "receiver_name": "Neha Sharma",
                    "receiver_phone": "+91 91234 56789",
                    "destination_address": "15, Connaught Place, New Delhi, Delhi - 110001",
                    "dest_lat": 28.6304,
                    "dest_lng": 77.2177,
                    "dest_po": "New Delhi GPO",
                },
                {
                    "sender_name": "Vikram Rathore",
                    "sender_phone": "+91 94215 88910",
                    "source_address": "Jayanagar, Bangalore, Karnataka - 560041",
                    "source_lat": 12.9307,
                    "source_lng": 77.5838,
                    "source_po": "Jayanagar H.O",
                    "receiver_name": "Priya Nair",
                    "receiver_phone": "+91 90082 11223",
                    "destination_address": "Park Street, Kolkata, West Bengal - 700016",
                    "dest_lat": 22.5487,
                    "dest_lng": 88.3516,
                    "dest_po": "Kolkata GPO",
                },
                {
                    "sender_name": "Karan Johar",
                    "sender_phone": "+91 98199 44332",
                    "source_address": "Banjara Hills, Hyderabad, Telangana - 500034",
                    "source_lat": 17.4156,
                    "source_lng": 78.4347,
                    "source_po": "Banjara Hills S.O",
                    "receiver_name": "Ananya Reddy",
                    "receiver_phone": "+91 99480 55667",
                    "destination_address": "Jubilee Hills, Hyderabad, Telangana - 500033",
                    "dest_lat": 17.4325,
                    "dest_lng": 78.4071,
                    "dest_po": "Jubilee Hills S.O",
                },
                {
                    "sender_name": "Rajesh Khanna",
                    "sender_phone": "+91 91122 33445",
                    "source_address": "Salt Lake, Kolkata, West Bengal - 700091",
                    "source_lat": 22.5726,
                    "source_lng": 88.4348,
                    "source_po": "Salt Lake Sector II S.O",
                    "receiver_name": "Kriti Sanon",
                    "receiver_phone": "+91 92233 44556",
                    "destination_address": "Adyar, Chennai, Tamil Nadu - 600020",
                    "dest_lat": 13.0033,
                    "dest_lng": 80.2550,
                    "dest_po": "Adyar S.O",
                },
                {
                    "sender_name": "Suresh Raina",
                    "sender_phone": "+91 95566 77889",
                    "source_address": "Andheri West, Mumbai, Maharashtra - 400053",
                    "source_lat": 19.1363,
                    "source_lng": 72.8273,
                    "source_po": "Andheri West S.O",
                    "receiver_name": "Pooja Hegde",
                    "receiver_phone": "+91 96677 88990",
                    "destination_address": "Sector 22, Noida, Uttar Pradesh - 201301",
                    "dest_lat": 28.5982,
                    "dest_lng": 77.3421,
                    "dest_po": "Noida Sector 22 S.O",
                },
                {
                    "sender_name": "Arjun Kapoor",
                    "sender_phone": "+91 93344 55667",
                    "source_address": "Gachibowli, Hyderabad, Telangana - 500032",
                    "source_lat": 17.4401,
                    "source_lng": 78.3489,
                    "source_po": "Gachibowli S.O",
                    "receiver_name": "Deepika Padukone",
                    "receiver_phone": "+91 94455 66778",
                    "destination_address": "Whitefield, Bangalore, Karnataka - 560066",
                    "dest_lat": 12.9698,
                    "dest_lng": 77.7500,
                    "dest_po": "Whitefield S.O",
                },
                {
                    "sender_name": "Ranveer Singh",
                    "sender_phone": "+91 92211 44332",
                    "source_address": "Bandra West, Mumbai, Maharashtra - 400050",
                    "source_lat": 19.0607,
                    "source_lng": 72.8362,
                    "source_po": "Bandra West S.O",
                    "receiver_name": "Alia Bhatt",
                    "receiver_phone": "+91 93322 55443",
                    "destination_address": "GK 2, New Delhi, Delhi - 110048",
                    "dest_lat": 28.5323,
                    "dest_lng": 77.2435,
                    "dest_po": "Greater Kailash S.O",
                }
            ]

            homogenous_query = {
                "$or": [
                    {"sender_name": {"$in": ["Rohan Sharma", "John Doe", None, ""]}},
                    {"receiver_name": {"$in": ["Priya Mehta", "Jane Doe", None, ""]}}
                ]
            }
            homogenous_parcels = list(parcels_col.find(homogenous_query))
            migrated_names_count = 0
            for p in homogenous_parcels:
                tid = p.get("tracking_id", "")
                if tid:
                    h = hashlib.md5(tid.encode('utf-8')).hexdigest()
                    idx = int(h, 16) % len(MIGRATION_COMBINATIONS)
                    combo = MIGRATION_COMBINATIONS[idx]
                    parcels_col.update_one(
                        {"_id": p["_id"]},
                        {"$set": {
                            "sender_name": combo["sender_name"],
                            "sender_phone": combo["sender_phone"],
                            "source_address": combo["source_address"],
                            "source_lat": combo["source_lat"],
                            "source_lng": combo["source_lng"],
                            "source_po": combo["source_po"],
                            "receiver_name": combo["receiver_name"],
                            "receiver_phone": combo["receiver_phone"],
                            "destination_address": combo["destination_address"],
                            "dest_lat": combo["dest_lat"],
                            "dest_lng": combo["dest_lng"],
                            "dest_po": combo["dest_po"]
                        }}
                    )
                    migrated_names_count += 1
            if migrated_names_count > 0:
                print(f"Backfill migration: migrated {migrated_names_count} homogeneous parcels to unique names/addresses.")
        except Exception as em:
            print(f"Homogeneous name backfill failed: {em}")

        # Create anomalies, notifications, and otps collections if missing
        if not db_service.is_mock and db_service.db is not None:
            existing_cols = db_service.db.list_collection_names()
            if "anomalies" not in existing_cols:
                db_service.db.create_collection("anomalies")
                print("Created anomalies collection")
            if "notifications" not in existing_cols:
                db_service.db.create_collection("notifications")
                print("Created notifications collection")
            if "otps" not in existing_cols:
                db_service.db.create_collection("otps")
                print("Created otps collection")
        
        # Backfill migration for ETA field and new parcel creation workflow fields
        import datetime
        from app.services.tracking_service import _parse_datetime_from_mongo
        from app.services.pricing_service import calculate_pricing
        cursor = parcels_col.find({
            "$or": [
                {"eta": None}, {"eta": {"$exists": False}},
                {"description": None}, {"description": {"$exists": False}},
                {"pricing_breakdown": None}, {"pricing_breakdown": {"$exists": False}}
            ]
        })
        updated_eta_count = 0
        updated_fields_count = 0
        for doc in cursor:
            update_data = {}
            
            # Check ETA
            if "eta" not in doc or doc["eta"] is None:
                created_at_val = doc.get("created_at")
                created_at_dt = _parse_datetime_from_mongo(created_at_val) if created_at_val else datetime.datetime.now(datetime.timezone.utc)
                duration_hours = float(doc.get("duration_hours", 24.0))
                eta_dt = created_at_dt + datetime.timedelta(hours=duration_hours)
                update_data["eta"] = eta_dt.strftime("%Y-%m-%d")
                updated_eta_count += 1

            # Check new parcel workflow fields
            if "description" not in doc or doc["description"] is None:
                update_data["description"] = "Standard shipment"
                update_data["ai_detected_category"] = "other"
                update_data["final_category"] = doc.get("category", "other")
                update_data["confidence"] = 0.5
                update_data["dimensions"] = {"l": 30.0, "w": 20.0, "h": 15.0}
                update_data["smart_options"] = []
                
            # Check pricing breakdown
            if "pricing_breakdown" not in doc or doc["pricing_breakdown"] is None:
                weight = float(doc.get("weight", 1.0))
                parcel_type = doc.get("parcel_type", "standard")
                insurance = doc.get("insurance", "standard")
                pricing_breakdown = calculate_pricing(
                    weight=weight,
                    length=30.0,
                    width=20.0,
                    height=15.0,
                    parcel_type=parcel_type,
                    smart_options=[],
                    insurance=insurance
                )
                update_data["pricing_breakdown"] = pricing_breakdown
                update_data["price_total"] = pricing_breakdown["total"]
                
            if update_data:
                parcels_col.update_one({"_id": doc["_id"]}, {"$set": update_data})
                updated_fields_count += 1
                
        if updated_eta_count > 0 or updated_fields_count > 0:
            print(f"Backfill migration: updated {updated_eta_count} ETAs, {updated_fields_count} workflow/pricing fields.")
    except Exception as e:
        print(f"Backfill migration failed: {e}")
    ensure_model_trained()
    ensure_risk_model_trained()
    ensure_anomaly_model_trained()
    yield


app = FastAPI(
    title=settings.app_name,
    description="AI-powered address validation, post office identification, and ETA prediction for AIPOSTAL",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routes.auth import router as auth_router

app.include_router(address_router)
app.include_router(eta_router)
app.include_router(risk_router)
app.include_router(tracking_router)
app.include_router(anomaly_router)
app.include_router(staff_router)
app.include_router(auth_router)


@app.get("/health")

def health():
    from app.ml.config import MODEL_PATH, META_PATH
    import json

    eta_meta = {}
    if META_PATH.exists():
        eta_meta = json.loads(META_PATH.read_text())

    return {
        "status": "ok",
        "dataset_source": "India Post 2026 (Department of Posts)",
        "addresses_loaded": len(data_store.addresses) if hasattr(data_store, "addresses") else 0,
        "post_offices_loaded": len(data_store.post_offices) if hasattr(data_store, "post_offices") else 0,
        "unique_pincodes": len(data_store.pin_codes) if hasattr(data_store, "pin_codes") else 0,
        "eta_model_ready": MODEL_PATH.exists(),
        "eta_model_type": eta_meta.get("model_type", "not_trained"),
        "eta_training_rows": eta_meta.get("training_rows", 0),
    }
