"""
Download real India Post PIN code dataset and build search indexes.

Source: India Post 2026 data via bharatpin open dataset
https://github.com/jeet308/bharatpin (Department of Posts derived)

Run from backend folder:
    python datasets/download_datasets.py
"""

from __future__ import annotations

import csv
import sys
import urllib.request
from pathlib import Path

import pandas as pd

DATASETS_DIR = Path(__file__).resolve().parent
RAW_URL = "https://raw.githubusercontent.com/jeet308/bharatpin/main/src/bharatpin/data/pincodes.csv"
RAW_FILE = DATASETS_DIR / "india_post_raw.csv"

# India geographic bounds (filter bad coordinates)
LAT_MIN, LAT_MAX = 6.0, 38.0
LNG_MIN, LNG_MAX = 68.0, 98.0


def download_raw() -> Path:
    print(f"Downloading India Post dataset from:\n  {RAW_URL}")
    DATASETS_DIR.mkdir(parents=True, exist_ok=True)

    def progress(block_num: int, block_size: int, total_size: int) -> None:
        if total_size > 0:
            pct = min(100, block_num * block_size * 100 // total_size)
            sys.stdout.write(f"\r  Progress: {pct}%")
            sys.stdout.flush()

    urllib.request.urlretrieve(RAW_URL, RAW_FILE, reporthook=progress)
    print(f"\n  Saved: {RAW_FILE} ({RAW_FILE.stat().st_size / 1024 / 1024:.1f} MB)")
    return RAW_FILE


def _clean_office_name(name: str) -> str:
    return name.replace(" B.O", "").replace(" S.O", "").replace(" H.O", "").strip()


def _valid_coords(lat: float, lng: float) -> bool:
    return LAT_MIN <= lat <= LAT_MAX and LNG_MIN <= lng <= LNG_MAX


def _safe_str(value) -> str:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return ""
    return str(value).strip()


def process(raw_path: Path) -> None:
    print("Processing dataset...")
    df = pd.read_csv(raw_path, dtype=str)
    df.columns = [c.strip().lower() for c in df.columns]

    df["latitude"] = pd.to_numeric(df["latitude"], errors="coerce")
    df["longitude"] = pd.to_numeric(df["longitude"], errors="coerce")
    df["pincode"] = df["pincode"].astype(str).str.zfill(6)

    # Drop rows outside India or missing coords (needed for map + nearest PO)
    geo_mask = df["latitude"].notna() & df["longitude"].notna()
    geo_mask &= df.apply(
        lambda r: _valid_coords(float(r["latitude"]), float(r["longitude"])), axis=1
    )
    geo_df = df[geo_mask].copy()
    print(f"  Total records: {len(df):,}")
    print(f"  With valid coordinates: {len(geo_df):,}")

    # ── post_offices.csv ──
    po_rows = []
    for i, row in geo_df.iterrows():
        district = _safe_str(row.get("district"))
        po_rows.append(
            {
                "id": f"PO{i}",
                "office_name": _safe_str(row["officename"]),
                "branch_type": _safe_str(row.get("officetype")),
                "city": _safe_str(row.get("area")) or district,
                "district": district,
                "state": _safe_str(row.get("state")),
                "pincode": row["pincode"],
                "latitude": round(float(row["latitude"]), 6),
                "longitude": round(float(row["longitude"]), 6),
            }
        )
    po_df = pd.DataFrame(po_rows)
    po_path = DATASETS_DIR / "post_offices.csv"
    po_df.to_csv(po_path, index=False)
    print(f"  post_offices.csv: {len(po_df):,} rows")

    # ── indian_addresses.csv (search index) ──
    addr_rows = []
    for i, row in geo_df.iterrows():
        locality = _safe_str(row.get("area")) or _clean_office_name(_safe_str(row["officename"]))
        district = _safe_str(row.get("district"))
        state = _safe_str(row.get("state"))
        pincode = row["pincode"]
        lat = round(float(row["latitude"]), 6)
        lng = round(float(row["longitude"]), 6)
        office_name = _safe_str(row.get("officename"))
        full_address = f"{locality}, {district}, {state} - {pincode}"
        search_text = f"{locality} {district} {state} {pincode} {office_name}".lower()

        addr_rows.append(
            {
                "id": f"ADDR{i}",
                "locality": locality,
                "city": district,
                "district": district,
                "state": state,
                "pincode": pincode,
                "latitude": lat,
                "longitude": lng,
                "full_address": full_address,
                "search_text": search_text,
            }
        )
    addr_df = pd.DataFrame(addr_rows)
    addr_path = DATASETS_DIR / "indian_addresses.csv"
    addr_df.to_csv(addr_path, index=False)
    print(f"  indian_addresses.csv: {len(addr_df):,} rows")

    # ── pin_codes.csv (one row per pincode, prefer Head/GPO office) ──
    type_priority = {"HO": 0, "H.O": 0, "SO": 1, "S.O": 1, "BO": 2, "B.O": 2}
    geo_df["_priority"] = geo_df["officetype"].map(lambda x: type_priority.get(str(x), 3))
    geo_df = geo_df.sort_values("_priority")
    pin_df = (
        geo_df.groupby("pincode", as_index=False)
        .first()[["pincode", "officename", "district", "state", "latitude", "longitude"]]
        .rename(
            columns={
                "officename": "office_name",
                "district": "district",
                "state": "state",
                "latitude": "latitude",
                "longitude": "longitude",
            }
        )
    )
    pin_path = DATASETS_DIR / "pin_codes.csv"
    pin_df.to_csv(pin_path, index=False)
    print(f"  pin_codes.csv: {len(pin_df):,} unique pincodes")

    # Sample rows
    print("\nSample address rows:")
    for _, r in addr_df.head(3).iterrows():
        print(f"  {r['full_address']} ({r['latitude']}, {r['longitude']})")


def main() -> None:
    raw = RAW_FILE if RAW_FILE.exists() else None
    if raw is None or "--force" in sys.argv:
        raw = download_raw()
    else:
        print(f"Using existing raw file: {RAW_FILE}")
        print("  Pass --force to re-download.")

    process(raw)
    print("\nDone. Restart the backend to load the new datasets.")


if __name__ == "__main__":
    main()
