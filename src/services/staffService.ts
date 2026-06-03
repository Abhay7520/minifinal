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

export function getVoiceLogs(agentName = "Rohan Sharma"): Promise<any[]> {
  return apiGet<any[]>(`/staff/voice-logs`, { agent: agentName });
}

// Logic for optimized route remains locally as it performs calculations
export async function getOptimizedRoute(agentName = "Rohan Sharma"): Promise<any> {
  // Let's resolve standard optimized routing sequence
  const stops = await getStaffDeliveries(agentName);
  const active = stops.filter(s => s.status === "current" || s.status === "upcoming");
  
  // Starting point coords (Pune sorting hub)
  let currLat = 18.5204;
  let currLng = 73.8567;
  
  const optimized = [];
  const remaining = [...active];
  let totalDist = 0;
  
  while(remaining.length > 0) {
    let closestIdx = -1;
    let minDist = Infinity;
    
    for(let i = 0; i < remaining.length; i++) {
      const s = remaining[i];
      // Haversine approx
      const R = 6371;
      const dLat = ((s.dest_lat - currLat) * Math.PI) / 180;
      const dLng = ((s.dest_lng - currLng) * Math.PI) / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(currLat*Math.PI/180) * Math.cos(s.dest_lat*Math.PI/180) * Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const dist = R * c;
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    }
    
    if (closestIdx !== -1) {
      const s = remaining.splice(closestIdx, 1)[0];
      totalDist += minDist;
      optimized.push(s);
      currLat = s.dest_lat;
      currLng = s.dest_lng;
    }
  }
  
  const polyline: number[][] = [[18.5204, 73.8567]];
  optimized.forEach(s => {
    polyline.push([s.dest_lat, s.dest_lng]);
  });
  
  return {
    optimized_order: optimized,
    total_distance_km: Number(totalDist.toFixed(2)),
    duration_text: `${Math.round((totalDist / 50) * 60)} mins`,
    polyline
  };
}