export interface TimelineItem {
  status: string;
  time: string;
  location: string;
  details: string;
  done: boolean;
  predicted: boolean;
}

export interface RiskInfo {
  risk_level: string;
  risk_score: number;
  risk_factors: string[];
  recommendation: string;
}

export interface ParcelDetails {
  source_address: string;
  destination_address: string;
  sender_name: string;
  receiver_name: string;
  weight: number;
  parcel_type: string;
  price_total: number;
}

export interface TrackingResponse {
  tracking_id: string;
  current_status: string;
  progress_percentage: number;
  current_location: string;
  current_lat: number;
  current_lng: number;
  estimated_delivery: string;
  timeline: TimelineItem[];
  risk_info: RiskInfo;
  parcel_details: ParcelDetails;
}
