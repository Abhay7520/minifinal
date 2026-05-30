import math
from typing import List, Optional, Tuple

from haversine import haversine, Unit


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    return round(haversine((lat1, lng1), (lat2, lng2), unit=Unit.KILOMETERS), 2)


def estimate_duration_hours(distance_km: float, speed_kmh: float = 55.0) -> float:
    if distance_km <= 0:
        return 0.0
    return round(distance_km / speed_kmh, 2)


def format_duration(hours: float) -> str:
    if hours < 1:
        minutes = max(1, int(hours * 60))
        return f"{minutes} min"
    whole = int(hours)
    minutes = int((hours - whole) * 60)
    if minutes == 0:
        return f"{whole} hr"
    return f"{whole} hr {minutes} min"


def transit_days_from_hours(hours: float) -> str:
    if hours <= 6:
        return "Same day"
    if hours <= 24:
        return "1 day"
    if hours <= 48:
        return "1–2 days"
    if hours <= 72:
        return "2–3 days"
    if hours <= 120:
        return "3–5 days"
    return "5–7 days"


def interpolate_route(
    start: Tuple[float, float],
    end: Tuple[float, float],
    points: int = 24,
) -> List[List[float]]:
    lat1, lng1 = start
    lat2, lng2 = end
    coords: List[List[float]] = []
    for i in range(points + 1):
        t = i / points
        lat = lat1 + (lat2 - lat1) * t
        lng = lng1 + (lng2 - lng1) * t
        mid = math.sin(math.pi * t)
        lat += mid * 0.15 * (lng2 - lng1)
        lng -= mid * 0.08 * (lat2 - lat1)
        coords.append([round(lat, 6), round(lng, 6)])
    return coords


def bounds_for_coords(coords: List[List[float]]) -> Optional[Tuple[List[float], List[float]]]:
    if not coords:
        return None
    lats = [c[0] for c in coords]
    lngs = [c[1] for c in coords]
    return [min(lats), min(lngs)], [max(lats), max(lngs)]
