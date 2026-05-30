# AIPOSTAL Backend

FastAPI backend for AI address validation and smart post office identification.

## Setup

```powershell
cd backend
pip install -r requirements.txt
python datasets/download_datasets.py
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

API docs: http://localhost:8000/docs

## Real dataset (India Post)

Data is downloaded from the **India Post 2026** open dataset (165k+ post offices, ~93% with GPS coordinates):

- Source: [bharatpin / Department of Posts](https://github.com/jeet308/bharatpin)
- Raw file: `datasets/india_post_raw.csv` (~22 MB)
- Re-download anytime: `python datasets/download_datasets.py --force`

### Dataset folder

```
backend/datasets/
├── download_datasets.py   # Downloads & processes real India Post CSV
├── india_post_raw.csv     # Raw download (gitignored)
├── indian_addresses.csv   # Search index with coordinates
├── pin_codes.csv          # Unique PIN codes
└── post_offices.csv       # All post offices with lat/lng
```

### indian_addresses.csv columns

| Column | Example |
|--------|---------|
| id | ADDR12345 |
| locality | Gachibowli |
| city | Hyderabad |
| district | Hyderabad |
| state | Telangana |
| pincode | 500032 |
| latitude | 17.4401 |
| longitude | 78.3489 |
| full_address | Gachibowli, Hyderabad, Telangana - 500032 |
| search_text | gachibowli hyderabad telangana 500032 ... |

### post_offices.csv columns

| Column | Example |
|--------|---------|
| id | PO12345 |
| office_name | Gachibowli S.O |
| branch_type | SO |
| city | Gachibowli |
| district | Hyderabad |
| state | Telangana |
| pincode | 500032 |
| latitude | 17.4405 |
| longitude | 78.3495 |

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/search-address?q=` | Fuzzy address autocomplete |
| POST | `/validate-address` | Validate source + destination, nearest POs, route |
| GET | `/nearest-postoffice?lat=&lng=` | Nearest post office by coordinates |
| POST | `/calculate-route` | Distance, duration, route polyline |
| GET | `/health` | Dataset load status |

## Phase 1 — ETA Prediction

Real ML model trained on **Delhivery Logistics** dataset (144k+ shipment records, Kaggle).

```powershell
# Download dataset + train model (auto-runs on first backend start)
python -m app.data.download_data
python -m app.ml.train
```

| Method | Path | Description |
|--------|------|-------------|
| POST | `/predict-eta` | ML delivery time prediction |

Model: `app/model/eta_model.pkl` (RandomForestRegressor, scikit-learn)
