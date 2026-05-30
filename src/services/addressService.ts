import { apiGet, apiPost } from "@/lib/api";
import type {
  AddressInput,
  AddressSuggestion,
  CalculateRouteResponse,
  PostOfficeInfo,
  ValidateAddressResponse,
} from "@/types/address";

export function searchAddresses(query: string): Promise<AddressSuggestion[]> {
  return apiGet<AddressSuggestion[]>("/search-address", { q: query });
}

export function validateAddresses(
  source: AddressInput,
  destination: AddressInput
): Promise<ValidateAddressResponse> {
  return apiPost<ValidateAddressResponse>("/validate-address", { source, destination });
}

export function getNearestPostOffice(
  lat: number,
  lng: number,
  limit = 1
): Promise<PostOfficeInfo[]> {
  return apiGet<PostOfficeInfo[]>("/nearest-postoffice", { lat, lng, limit });
}

export function calculateRoute(
  source: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<CalculateRouteResponse> {
  return apiPost<CalculateRouteResponse>("/calculate-route", {
    source,
    destination,
  });
}

export function checkHealth(): Promise<{ status: string; addresses_loaded: number }> {
  return apiGet("/health");
}
