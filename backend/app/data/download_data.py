"""
Download real Delhivery logistics dataset (Kaggle / Delhivery case study).

Source: Delhivery intra-city & inter-city logistics shipment records
URL:  https://www.kaggle.com/datasets/devarajv88/delhivery-logistics-dataset
Mirror: public CDN used by multiple ML case studies

Run:
    python -m app.data.download_data
"""

from __future__ import annotations

import sys
import urllib.request
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent
DELHIVERY_URL = (
    "https://d2beiqkhq929f0.cloudfront.net/public_assets/assets/000/001/551/"
    "original/delhivery_data.csv?1642751181"
)
OUTPUT_FILE = DATA_DIR / "delhivery_logistics.csv"


def download(force: bool = False) -> Path:
    if OUTPUT_FILE.exists() and not force:
        print(f"Using existing dataset: {OUTPUT_FILE}")
        return OUTPUT_FILE

    print(f"Downloading Delhivery logistics dataset...")
    print(f"  Source: {DELHIVERY_URL}")

    def progress(block: int, block_size: int, total: int) -> None:
        if total > 0:
            pct = min(100, block * block_size * 100 // total)
            sys.stdout.write(f"\r  Progress: {pct}%")
            sys.stdout.flush()

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(DELHIVERY_URL, OUTPUT_FILE, reporthook=progress)
    size_mb = OUTPUT_FILE.stat().st_size / 1024 / 1024
    print(f"\n  Saved: {OUTPUT_FILE} ({size_mb:.1f} MB)")
    return OUTPUT_FILE


if __name__ == "__main__":
    download(force="--force" in sys.argv)
