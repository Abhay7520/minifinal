import { apiGet, apiPost, getApiUrl } from "@/lib/api";

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
  assigned_branch?: string;
  status: "active" | "inactive" | "suspended";
  rating: number;
  deliveries_completed: number;
  deliveries_failed: number;
  last_active: string;
}

export interface User {
  _id?: string;
  name: string;
  email: string;
  role: "user" | "staff" | "admin";
  status?: "active" | "suspended";
  created_at: string;
}

export interface SystemSettings {
  system_status: "normal" | "restricted" | "maintenance";
  ai_confidence_threshold: number;
  delay_threshold_hours: number;
  auto_assign_agents: boolean;
  maintenance_mode: boolean;
}

export interface AnalyticsStats {
  totalUsers: number;
  totalStaff: number;
  totalParcels: number;
  activeParcels: number;
  deliveredParcels: number;
  delayedParcels: number;
  revenue: number;
  monthlyTrends: Array<{
    name: string;
    parcels: number;
    revenue: number;
  }>;
}

export interface AiMonitoringData {
  anomalies: any[];
  fraudAlerts: any[];
  predictions: any[];
  validationLogs: any[];
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

export function getLiveMap(): Promise<LiveMapData> {
  return apiGet<LiveMapData>("/admin/live-map/live-map");
}

export function getAiPredictions(): Promise<FailurePrediction[]> {
  return apiGet<FailurePrediction[]>("/admin/predictions");
}

export function getSystemAlerts(): Promise<AdminAlert[]> {
  return apiGet<AdminAlert[]>("/admin/alerts");
}

export function getHeatmapAnalytics(): Promise<HeatmapItem[]> {
  return apiGet<HeatmapItem[]>("/admin/heatmap");
}

export function getParcelDetail(
  trackingId: string
): Promise<UniversalTrackResponse> {
  return apiGet<UniversalTrackResponse>(`/admin/parcel/${trackingId}`);
}

export function getHubAnalytics(): Promise<HubStats[]> {
  return apiGet<HubStats[]>("/admin/hubs");
}

export function resolveIncident(
  incidentId: string
): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>(
    "/admin/incidents/resolve",
    {
      incident_id: incidentId,
    }
  );
}

// User Management
export function getUsersList(): Promise<User[]> {
  return apiGet<User[]>("/admin/users");
}

export function toggleUserStatus(email: string, status: "active" | "suspended"): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>("/admin/users/status", { email, status });
}

export async function deleteUser(email: string): Promise<{ success: boolean; message: string }> {
  const token = localStorage.getItem("token");
  const url = getApiUrl(`/admin/users/${encodeURIComponent(email)}`);
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return res.json();
}

// Staff Management
export function getStaffList(): Promise<StaffMember[]> {
  return apiGet<StaffMember[]>("/admin/staff");
}

export function assignStaffZone(
  staffId: string,
  zone: string
): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>(
    "/admin/staff/assign-zone",
    {
      staff_id: staffId,
      zone,
    }
  );
}

export function changeStaffStatus(
  staffId: string,
  status: string
): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>(
    "/admin/staff/suspend",
    {
      staff_id: staffId,
      status,
    }
  );
}

export function reassignParcelStaff(
  trackingId: string,
  agentName: string
): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>(
    "/admin/staff/reassign-parcel",
    {
      tracking_id: trackingId,
      agent_name: agentName,
    }
  );
}

export function addStaff(staff: Partial<StaffMember>): Promise<{ success: boolean; message: string; data: StaffMember }> {
  return apiPost<{ success: boolean; message: string; data: StaffMember }>("/admin/staff", staff);
}

export async function editStaff(staffId: string, staff: Partial<StaffMember>): Promise<{ success: boolean; message: string; data: StaffMember }> {
  const token = localStorage.getItem("token");
  const url = getApiUrl(`/admin/staff/${encodeURIComponent(staffId)}`);
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(staff)
  });
  return res.json();
}

export async function deleteStaff(staffId: string): Promise<{ success: boolean; message: string }> {
  const token = localStorage.getItem("token");
  const url = getApiUrl(`/admin/staff/${encodeURIComponent(staffId)}`);
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return res.json();
}

// Parcel Management
export function getParcelsList(search = "", status?: number, delayed = false): Promise<any[]> {
  const params: Record<string, string | number> = { search };
  if (status !== undefined) params.status = status;
  if (delayed) params.delayed = "true";
  return apiGet<any[]>("/admin/parcels", params);
}

export function updateParcelStatus(
  trackingId: string,
  statusText: string,
  stage: number,
  location?: string
): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>("/admin/parcels/status", {
    tracking_id: trackingId,
    status_text: statusText,
    manual_stage_override: stage,
    current_location_name: location
  });
}

// Analytics Stats
export function getAnalyticsStats(): Promise<AnalyticsStats> {
  return apiGet<AnalyticsStats>("/admin/analytics/stats");
}

// AI Monitoring
export function getAiMonitoring(): Promise<AiMonitoringData> {
  return apiGet<AiMonitoringData>("/admin/ai-monitoring");
}

// Settings
export function getSystemSettings(): Promise<SystemSettings> {
  return apiGet<SystemSettings>("/admin/settings");
}

export function saveSystemSettings(settings: SystemSettings): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>("/admin/settings", settings);
}
