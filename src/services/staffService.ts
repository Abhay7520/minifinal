import { apiGet, apiPost } from "@/lib/api";
import { DeliveryStop, StaffAnalytics, PriorityStop, EtaResponse, IncidentReport } from "@/types/staff"; // Adjust import path if needed

// Note: NODE_API_BASE is removed. 
// The central api.ts will now handle routing based on the path.

export function getStaffDeliveries(agentName = "Rohan Sharma"): Promise<DeliveryStop[]> {
  return apiGet<DeliveryStop[]>(`/staff/deliveries`, { agent: agentName });
}

export function verifyDeliveryOtp(trackingId: string, otp: string, isOffline = false, agentId = "Rohan Sharma"): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>(`/staff/verify-otp`, { 
    tracking_id: trackingId, 
    otp, 
    is_offline: isOffline, 
    agent_id: agentId 
  });
}

export function markDeliveryFailed(trackingId: string, reason: string, agentId = "Rohan Sharma"): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>(`/staff/fail`, { 
    tracking_id: trackingId, 
    reason, 
    agent_id: agentId 
  });
}

export function reattemptDelivery(trackingId: string, agentId = "Rohan Sharma"): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>(`/staff/reattempt`, { 
    tracking_id: trackingId, 
    agent_id: agentId 
  });
}

export function regenerateOtp(trackingId: string, agentId = "Rohan Sharma"): Promise<{ success: boolean; otp_code?: string; message: string }> {
  return apiPost<{ success: boolean; otp_code?: string; message: string }>(`/staff/delivery/${trackingId}/regenerate-otp`, {
    agent_id: agentId
  });
}

export function logDeliveryAction(trackingId: string, actionType: string): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>(`/staff/action`, { 
    tracking_id: trackingId, 
    action_type: actionType 
  });
}

export function getStaffAnalytics(agentName = "Rohan Sharma"): Promise<StaffAnalytics> {
  return apiGet<StaffAnalytics>(`/staff/analytics`, { agent: agentName });
}

export function getPriorityRoutes(agentLat: number, agentLng: number): Promise<PriorityStop[]> {
  return apiGet<PriorityStop[]>(`/staff/priority-route`, { lat: agentLat, lng: agentLng });
}

export function getStopEta(trackingId: string, agentLat: number, agentLng: number): Promise<EtaResponse> {
  return apiGet<EtaResponse>(`/staff/eta/${trackingId}`, { lat: agentLat, lng: agentLng });
}

export function logVoiceCommand(agentId: string, command: string, success: boolean): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(`/staff/voice-log`, { agent_id: agentId, command, success });
}

export function updateAgentLocation(agentId: string, lat: number, lng: number, speed = 0, batteryLevel = 100): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(`/location/update`, { agent_id: agentId, lat, lng, speed, battery_level: batteryLevel });
}

export function getLiveLocation(agentId: string): Promise<{ lat: number; lng: number; speed: number; battery_level: number }> {
  return apiGet<{ lat: number; lng: number; speed: number; battery_level: number }>(`/location/live/${agentId}`);
}

export function reportIncident(report: IncidentReport): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>(`/incidents/report`, report);
}

// Logic for optimized route remains locally as it performs calculations
export async function getOptimizedRoute(agentName = "Rohan Sharma"): Promise<any> {
  const stops = await getStaffDeliveries(agentName);
  // ... (keep your existing calculation logic here)
}