export interface Coordinates {
  lat: number;
  lng: number;
}

export interface AddressSuggestion {
  id: string;
  label: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  score: number;
}

export interface AddressInput {
  address: string;
  lat?: number | null;
  lng?: number | null;
}

export interface ValidatedAddress {
  input: string;
  matched_label: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  confidence: number;
  is_valid: boolean;
  serviceable: boolean;
}

export interface PostOfficeInfo {
  id: string;
  name: string;
  branch_type: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  distance_km: number;
}

export interface RouteInfo {
  distance_km: number;
  duration_hours: number;
  duration_text: string;
  transit_days: string;
  coordinates: number[][];
}

export interface ValidateAddressResponse {
  source: ValidatedAddress;
  destination: ValidatedAddress;
  nearest_source_postoffice: PostOfficeInfo;
  nearest_destination_postoffice: PostOfficeInfo;
  route: RouteInfo;
  overall_serviceable: boolean;
  overall_confidence: number;
}

export interface CalculateRouteResponse {
  distance_km: number;
  duration_hours: number;
  duration_text: string;
  transit_days: string;
  coordinates: number[][];
}

export interface SelectedAddress {
  text: string;
  suggestion?: AddressSuggestion | null;
}
