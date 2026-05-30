import { apiGet, apiPost } from "@/lib/api";

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
