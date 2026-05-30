export interface DeliveryStop {
  id: string;
  customer: string;
  phone: string;
  address: string;
  dest_lat: number;
  dest_lng: number;
  source_lat: number;
  source_lng: number;
  eta: string;
  status: string;
  otp: string;
  parcel_type: string;
  weight: number;
  priority: string;
  progress: number;
  price: number;
}

export interface StaffAnalytics {
  summary: {
    completed: number;
    failed: number;
    active: number;
    performance_score: string;
    avg_delivery_time: string;
    productivity_insight: string;
  };
  voice_assistant: {
    total_commands: number;
    success_rate: number;
  };
  charts: {
    completion_trend: Array<{ hour: string; stops: number }>;
    mileage_trend: Array<{ day: string; km: number }>;
    status_ratio: Array<{ name: string; value: number }>;
  };
}

export interface PriorityStop {
  id: string;
  customer: string;
  address: string;
  dest_lat: number;
  dest_lng: number;
  distance_km: number;
  weight: number;
  parcel_type: string;
  priority_score: number;
  badges: string[];
}

export interface EtaResponse {
  tracking_id: string;
  distance_km: number;
  duration_minutes: number;
  eta_time: string;
  weather_impact: string;
  weather_severity: string;
  traffic_delay_minutes: number;
  late_risk: boolean;
  is_osrm: boolean;
}

export interface IncidentReport {
  tracking_id: string;
  agent_id: string;
  issue_type: string;
  details: string;
  lat: number;
  lng: number;
  image_url?: string;
}

