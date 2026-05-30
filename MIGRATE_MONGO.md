# MongoDB local → Atlas migration (AIPOSTAL)

## Target Atlas URI
`mongodb+srv://postal_user:aipostal@cluster0.g0mulqc.mongodb.net/?appName=Cluster0`

## What to migrate
All collections in your local database `aipostal` (as used by the app code):
- `parcels`
- `route_history`
- `risk_predictions`
- `shipment_status`
- `tracking_history`
- `anomaly_logs`

(Plus any other collections that already exist in local `aipostal`.)

---

## Option A (recommended): mongodump + mongorestore

### 1) Install MongoDB Database Tools
`mongodump` and `mongorestore` must be available on your PATH.

### 2) Dump from local
```bash
mongodump --uri="mongodb://localhost:27017/aipostal" --out="./mongo_dump_local"
```

### 3) Restore into Atlas
```bash
mongorestore \
  --uri="mongodb+srv://postal_user:aipostal@cluster0.g0mulqc.mongodb.net/?appName=Cluster0" \
  --db="aipostal" \
  "./mongo_dump_local/aipostal"
```

### 4) Verify
- Start both backends.
- Confirm data exists by calling existing endpoints (e.g. tracking/anomalies) and/or by checking Atlas collections.

---

## Option B: if tools are not available
Create a small script to read from local and insert into Atlas using PyMongo.

(If you want this option, tell me and I will add `scripts/migrate_mongo.py`.)

---

## Notes
- If your Atlas project requires IP allow-listing and/or username/password auth, ensure the provided credentials work from your current network.
- App code now defaults to Atlas URI; you can still override via env vars:
  - Python: `MONGODB_URL` (not currently wired as env var; easiest is editing `backend/app/.env` if you use one)
  - Node: `MONGODB_URI`

