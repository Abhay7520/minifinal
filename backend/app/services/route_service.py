from __future__ import annotations

from typing import List, Optional, Tuple

import httpx

from app.config import settings
from app.models.schemas import CalculateRouteResponse, RouteInfo
from app.utils.geo import (
    estimate_duration_hours,
    format_duration,
    haversine_km,
    interpolate_route,
    transit_days_from_hours,
)


async def _fetch_osrm_route(
    source_lat: float,
    source_lng: float,
    dest_lat: float,
    dest_lng: float,
) -> Optional[Tuple[float, float, List[List[float]]]]:
    url = (
        f"{settings.osrm_base_url}/route/v1/driving/"
        f"{source_lng},{source_lat};{dest_lng},{dest_lat}"
        f"?overview=full&geometries=geojson"
    )
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            if data.get("code") != "Ok" or not data.get("routes"):
                return None
            route = data["routes"][0]
            distance_km = round(route["distance"] / 1000, 2)
            duration_hours = round(route["duration"] / 3600, 2)
            coords = [
                [round(coord[1], 6), round(coord[0], 6)]
                for coord in route["geometry"]["coordinates"]
            ]
            return distance_km, duration_hours, coords
    except Exception:
        return None


async def calculate_route(
    source_lat: float,
    source_lng: float,
    dest_lat: float,
    dest_lng: float,
) -> RouteInfo:
    osrm = await _fetch_osrm_route(source_lat, source_lng, dest_lat, dest_lng)

    if osrm:
        distance_km, duration_hours, coordinates = osrm
    else:
        distance_km = haversine_km(source_lat, source_lng, dest_lat, dest_lng)
        duration_hours = estimate_duration_hours(distance_km, settings.avg_road_speed_kmh)
        coordinates = interpolate_route(
            (source_lat, source_lng),
            (dest_lat, dest_lng),
        )

    return RouteInfo(
        distance_km=distance_km,
        duration_hours=duration_hours,
        duration_text=format_duration(duration_hours),
        transit_days=transit_days_from_hours(duration_hours),
        coordinates=coordinates,
    )


async def calculate_route_response(
    source_lat: float,
    source_lng: float,
    dest_lat: float,
    dest_lng: float,
) -> CalculateRouteResponse:
    route = await calculate_route(source_lat, source_lng, dest_lat, dest_lng)
    return CalculateRouteResponse(
        distance_km=route.distance_km,
        duration_hours=route.duration_hours,
        duration_text=route.duration_text,
        transit_days=route.transit_days,
        coordinates=route.coordinates,
    )
