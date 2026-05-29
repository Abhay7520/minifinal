export interface PredictEtaRequest {
  source_lat: number;
  source_lng: number;
  dest_lat: number;
  dest_lng: number;
  distance_km: number;
  weight: number;
  parcel_type: string;
  insurance?: string;
  time_slot?: string;
}

export interface PredictEtaResponse {
  estimated_days: number;
  estimated_hours: number;
  eta_range: {
    min_days: number;
    max_days: number;
  };
  confidence_score: number;
  risk_factors: string[];
  model_type: string;
}
