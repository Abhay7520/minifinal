from typing import List

from app.models.schemas import PostOfficeInfo
from app.services.data_loader import data_store
from app.utils.geo import haversine_km


def find_nearest_postoffice(lat: float, lng: float, limit: int = 1) -> List[PostOfficeInfo]:
    offices = data_store.post_offices.copy()
    offices["distance_km"] = offices.apply(
        lambda r: haversine_km(lat, lng, float(r["latitude"]), float(r["longitude"])),
        axis=1,
    )
    offices = offices.sort_values("distance_km").head(limit)

    results: List[PostOfficeInfo] = []
    for _, row in offices.iterrows():
        results.append(
            PostOfficeInfo(
                id=str(row["id"]),
                name=str(row["office_name"]),
                branch_type=str(row["branch_type"]),
                city=str(row["city"]),
                district=str(row["district"]),
                state=str(row["state"]),
                pincode=str(row["pincode"]),
                lat=float(row["latitude"]),
                lng=float(row["longitude"]),
                distance_km=round(float(row["distance_km"]), 2),
            )
        )
    return results


def get_nearest_postoffice(lat: float, lng: float) -> PostOfficeInfo:
    nearest = find_nearest_postoffice(lat, lng, limit=1)
    if not nearest:
        raise ValueError("No post offices available in dataset")
    return nearest[0]
