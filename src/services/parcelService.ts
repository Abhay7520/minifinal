import { apiGet, apiPost } from "@/lib/api";

export interface ParcelBookingInput {
  sender_name: string;
  sender_phone: string;
  source_address: string;
  source_lat: number;
  source_lng: number;
  source_po: string;
  
  receiver_name: string;
  receiver_phone: string;
  destination_address: string;
  dest_lat: number;
  dest_lng: number;
  dest_po: string;
  
  weight: number;
  parcel_type: string;
  declared_value: number;
  category: string;
  time_slot: string;
  insurance: string;
  
  distance_km: number;
  duration_hours: number;
  duration_text: string;
  transit_days: string;
  route_coordinates: number[][];
  
  price_total: number;
  weather?: string;
  congestion?: string;
}

export interface BookingResponse {
  tracking_id: string;
  message: string;
}

export function bookParcel(payload: ParcelBookingInput): Promise<BookingResponse> {
  return apiPost<BookingResponse>("/parcels", payload);
}

export interface ParcelSummary {
  tracking_id: string;
  owner_email?: string | null;
  created_at?: string;
  sender_name?: string;
  receiver_name?: string;
  source_address?: string;
  destination_address?: string;
}

export function getMyParcels(): Promise<ParcelSummary[]> {
  return apiGet<ParcelSummary[]>("/me/parcels");
}

// Backward-compatible name used by UserOrders.tsx
export function getAllParcels(): Promise<ParcelSummary[]> {
  return getMyParcels();
}





