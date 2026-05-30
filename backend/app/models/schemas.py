from typing import List, Optional

from pydantic import BaseModel, Field


class Coordinates(BaseModel):
    lat: float
    lng: float


class AddressSuggestion(BaseModel):
    id: str
    label: str
    locality: str
    city: str
    state: str
    pincode: str
    lat: float
    lng: float
    score: float


class AddressInput(BaseModel):
    address: str = Field(..., min_length=2)
    lat: Optional[float] = None
    lng: Optional[float] = None


class ValidatedAddress(BaseModel):
    input: str
    matched_label: str
    locality: str
    city: str
    state: str
    pincode: str
    lat: float
    lng: float
    confidence: float
    is_valid: bool
    serviceable: bool


class PostOfficeInfo(BaseModel):
    id: str
    name: str
    branch_type: str
    city: str
    district: str
    state: str
    pincode: str
    lat: float
    lng: float
    distance_km: float


class RouteInfo(BaseModel):
    distance_km: float
    duration_hours: float
    duration_text: str
    transit_days: str
    coordinates: List[List[float]]


class ValidateAddressRequest(BaseModel):
    source: AddressInput
    destination: AddressInput


class ValidateAddressResponse(BaseModel):
    source: ValidatedAddress
    destination: ValidatedAddress
    nearest_source_postoffice: PostOfficeInfo
    nearest_destination_postoffice: PostOfficeInfo
    route: RouteInfo
    overall_serviceable: bool
    overall_confidence: float


class CalculateRouteRequest(BaseModel):
    source: Coordinates
    destination: Coordinates


class CalculateRouteResponse(BaseModel):
    distance_km: float
    duration_hours: float
    duration_text: str
    transit_days: str
    coordinates: List[List[float]]
