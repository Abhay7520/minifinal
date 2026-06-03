import os
import hashlib
from pymongo import MongoClient

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

def run_backfill():
    mongo_url = "mongodb+srv://postal_user:aipostal@cluster0.g0mulqc.mongodb.net/?appName=Cluster0"
    db_name = "aipostal"
    
    print(f"Connecting to MongoDB database: {db_name}...")
    client = MongoClient(mongo_url)
    db = client[db_name]
    parcels_col = db["parcels"]
    
    # Query for parcels that match old defaults
    # (either Rohan Sharma/John Doe as sender OR Priya Mehta/Jane Doe/empty as receiver)
    query = {
        "$or": [
            {"sender_name": {"$in": ["Rohan Sharma", "John Doe", None, ""]}},
            {"receiver_name": {"$in": ["Priya Mehta", "Jane Doe", None, ""]}}
        ]
    }
    
    matching_parcels = list(parcels_col.find(query))
    print(f"Found {len(matching_parcels)} parcels to migrate.")
    
    updated_count = 0
    for parcel in matching_parcels:
        tracking_id = parcel.get("tracking_id", "")
        if not tracking_id:
            continue
            
        # Determine unique combination deterministically based on tracking_id
        h = hashlib.md5(tracking_id.encode('utf-8')).hexdigest()
        idx = int(h, 16) % len(MIGRATION_COMBINATIONS)
        combo = MIGRATION_COMBINATIONS[idx]
        
        # We also need to keep the route coordinates consistent. Since route coordinates are precalculated,
        # we can keep them, but update the start/end PO and address names to be unique and realistic.
        update_data = {
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
        }
        
        parcels_col.update_one({"_id": parcel["_id"]}, {"$set": update_data})
        updated_count += 1
        print(f"Migrated parcel {tracking_id} -> Sender: {combo['sender_name']}, Receiver: {combo['receiver_name']}")
        
    print(f"Successfully migrated {updated_count} parcels.")

if __name__ == "__main__":
    run_backfill()
