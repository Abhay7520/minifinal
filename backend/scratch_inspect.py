import os
from pymongo import MongoClient

def inspect_db():
    mongo_url = "mongodb+srv://postal_user:aipostal@cluster0.g0mulqc.mongodb.net/?appName=Cluster0"
    db_name = "aipostal"
    
    print(f"Connecting to MongoDB db: {db_name}...")
    client = MongoClient(mongo_url)
    db = client[db_name]
    parcels_col = db["parcels"]
    
    count = parcels_col.count_documents({})
    print(f"Total parcels in DB: {count}")
    
    cursor = parcels_col.find().limit(10)
    for doc in cursor:
        print(f"ID: {doc.get('tracking_id')} | From: {doc.get('sender_name')} ({doc.get('source_address')[:30]}...) | To: {doc.get('receiver_name')} ({doc.get('destination_address')[:30]}...)")

if __name__ == "__main__":
    inspect_db()
