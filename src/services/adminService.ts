import { apiGet } from "@/lib/api";
export interface LiveMapData {
  staff: Array<{
    id: string;
    lat: number;
    lng: number;
    speed: number;
    battery: number;
    label: string;
    status: "agent";
  }>;
  parcels: Array<{
    id: string;
    lat: number;
    lng: number;
    label: string;
    status: "moving" | "delivered" | "delayed";
  }>;
  delayed_hubs: Array<{
    id: string;
    lat: number;
    lng: number;
    label: string;
    status: "delayed";
  }>;
  center: [number, number];
}

export interface FailurePrediction {
  tracking_id: string;
  customer: string;
  address: string;
  failure_probability: number;
  late_delivery_risk: number;
  route_failure_risk: number;
  customer_unavailable_risk: number;
  risk_level: "Critical" | "High" | "Medium" | "Low";
  confidence_percentage: number;
  top_risk_factors: string[];
  weather_impact: string;
}

export interface AdminAlert {
  _id: string;
  type: "critical" | "warning" | "info";
  category: "SLA" | "Hub" | "Weather" | "Route" | "Staff";
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface HeatmapItem {
  name: string;
  lat: number;
  lng: number;
  count: number;
  delays: number;
  severity: "critical" | "high" | "medium" | "low";
}

export interface StaffMember {
  staff_id: string;
  name: string;
  email: string;
  phone: string;
  assigned_zone: string;
  status: "active" | "inactive" | "suspended";
  rating: number;
  deliveries_completed: number;
  deliveries_failed: number;
  last_active: string;
}

export interface HubStats {
  name: string;
  active_load: number;
  speed_items_hr: number;
  delayed_parcels: number;
  staff_count: number;
  efficiency: number;
  suggestion: string;
}

export interface UniversalTrackResponse {
  parcel: {
    tracking_id: string;
    receiver_name: string;
    receiver_phone: string;
    destination_address: string;
    parcel_type: string;
    weight: number;
    price_total: number;
  };
  status: {
    status: string;
    progress_percentage: number;
    current_location_name: string;
  };
  history: Array<{
    timestamp: string;
    location: string;
    status: string;
    details: string;
  }>;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...(options?.headers || {})
    }
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.error || data?.message || response.statusText);
  }

  return data as T;
}

export function getLiveMap(): Promise<LiveMapData> {
  return request<LiveMapData>(`${NODE_API_BASE}/admin/live-map/live-map`);
}

export function getAiPredictions(): Promise<FailurePrediction[]> {
  return request<FailurePrediction[]>(`${NODE_API_BASE}/admin/predictions`);
}

export function getSystemAlerts(): Promise<AdminAlert[]> {
  return request<AdminAlert[]>(`${NODE_API_BASE}/admin/alerts`);
}

export function getHeatmapAnalytics(): Promise<HeatmapItem[]> {
  return request<HeatmapItem[]>(`${NODE_API_BASE}/admin/heatmap`);
}

export function getParcelDetail(trackingId: string): Promise<UniversalTrackResponse> {
  return request<UniversalTrackResponse>(`${NODE_API_BASE}/admin/parcel/${trackingId}`);
}

export function getHubAnalytics(): Promise<HubStats[]> {
  return request<HubStats[]>(`${NODE_API_BASE}/admin/hubs`);
}

export function resolveIncident(incidentId: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`${NODE_API_BASE}/admin/incidents/resolve`, {
    method: "POST",
    body: JSON.stringify({ incident_id: incidentId })
  });
}

export function getStaffList(): Promise<StaffMember[]> {
  return request<StaffMember[]>(`${NODE_API_BASE}/admin/staff`);
}

export function assignStaffZone(staffId: string, zone: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`${NODE_API_BASE}/admin/staff/assign-zone`, {
    method: "POST",
    body: JSON.stringify({ staff_id: staffId, zone })
  });
}

export function changeStaffStatus(staffId: string, status: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`${NODE_API_BASE}/admin/staff/suspend`, {
    method: "POST",
    body: JSON.stringify({ staff_id: staffId, status })
  });
}

export function reassignParcelStaff(trackingId: string, agentName: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`${NODE_API_BASE}/admin/staff/reassign-parcel`, {
    method: "POST",
    body: JSON.stringify({ tracking_id: trackingId, agent_name: agentName })
  });
}
