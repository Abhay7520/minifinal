from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import (
    AddressSuggestion,
    CalculateRouteRequest,
    CalculateRouteResponse,
    PostOfficeInfo,
    ValidateAddressRequest,
    ValidateAddressResponse,
)
from app.services.address_service import search_addresses, validate_address
from app.services.postoffice_service import find_nearest_postoffice, get_nearest_postoffice
from app.services.route_service import calculate_route, calculate_route_response

router = APIRouter(tags=["AIPOSTAL"])


@router.get("/search-address", response_model=list[AddressSuggestion])
def search_address(q: str = Query(..., min_length=2, description="Partial or fuzzy address query")):
    return search_addresses(q)


@router.post("/validate-address", response_model=ValidateAddressResponse)
async def validate_addresses(payload: ValidateAddressRequest):
    source = validate_address(payload.source)
    destination = validate_address(payload.destination)

    if not source.is_valid or not destination.is_valid:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "One or both addresses could not be validated",
                "source_valid": source.is_valid,
                "destination_valid": destination.is_valid,
            },
        )

    nearest_source = get_nearest_postoffice(source.lat, source.lng)
    nearest_dest = get_nearest_postoffice(destination.lat, destination.lng)
    route = await calculate_route(source.lat, source.lng, destination.lat, destination.lng)

    overall_confidence = round((source.confidence + destination.confidence) / 2, 1)
    overall_serviceable = source.serviceable and destination.serviceable and route.distance_km > 0

    return ValidateAddressResponse(
        source=source,
        destination=destination,
        nearest_source_postoffice=nearest_source,
        nearest_destination_postoffice=nearest_dest,
        route=route,
        overall_serviceable=overall_serviceable,
        overall_confidence=overall_confidence,
    )


@router.get("/nearest-postoffice", response_model=list[PostOfficeInfo])
def nearest_postoffice(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    limit: int = Query(1, ge=1, le=5),
):
    return find_nearest_postoffice(lat, lng, limit=limit)


@router.post("/calculate-route", response_model=CalculateRouteResponse)
async def calculate_route_endpoint(payload: CalculateRouteRequest):
    return await calculate_route_response(
        payload.source.lat,
        payload.source.lng,
        payload.destination.lat,
        payload.destination.lng,
    )
