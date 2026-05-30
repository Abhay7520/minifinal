const NODE_API_BASE = "http://localhost:5000/api";

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
  status: "delivered" | "current" | "upcoming" | "failed";
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
  tracking_id?: string;
  agent_id: string;
  issue_type: string;
  details?: string;
  lat?: number;
  lng?: number;
  image_url?: string;
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

export function getStaffDeliveries(agentName = "Rohan Sharma"): Promise<DeliveryStop[]> {
  return request<DeliveryStop[]>(`${NODE_API_BASE}/staff/deliveries?agent=${encodeURIComponent(agentName)}`);
}

export function verifyDeliveryOtp(trackingId: string, otp: string, isOffline = false, agentId = "Rohan Sharma"): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`${NODE_API_BASE}/staff/verify-otp`, {
    method: "POST",
    body: JSON.stringify({ tracking_id: trackingId, otp, is_offline: isOffline, agent_id: agentId })
  });
}

export function markDeliveryFailed(trackingId: string, reason: string, agentId = "Rohan Sharma"): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`${NODE_API_BASE}/staff/fail`, {
    method: "POST",
    body: JSON.stringify({ tracking_id: trackingId, reason, agent_id: agentId })
  });
}

export function reattemptDelivery(trackingId: string, agentId = "Rohan Sharma"): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`${NODE_API_BASE}/staff/reattempt`, {
    method: "POST",
    body: JSON.stringify({ tracking_id: trackingId, agent_id: agentId })
  });
}

export function logDeliveryAction(trackingId: string, actionType: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`${NODE_API_BASE}/staff/action`, {
    method: "POST",
    body: JSON.stringify({ tracking_id: trackingId, action_type: actionType })
  });
}

export function getStaffAnalytics(agentName = "Rohan Sharma"): Promise<StaffAnalytics> {
  return request<StaffAnalytics>(`${NODE_API_BASE}/staff/analytics?agent=${encodeURIComponent(agentName)}`);
}

export function getPriorityRoutes(agentLat: number, agentLng: number): Promise<PriorityStop[]> {
  return request<PriorityStop[]>(`${NODE_API_BASE}/staff/priority-route?lat=${agentLat}&lng=${agentLng}`);
}

export function getStopEta(trackingId: string, agentLat: number, agentLng: number): Promise<EtaResponse> {
  return request<EtaResponse>(`${NODE_API_BASE}/staff/eta/${trackingId}?lat=${agentLat}&lng=${agentLng}`);
}

export function logVoiceCommand(agentId: string, command: string, success: boolean): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${NODE_API_BASE}/staff/voice-log`, {
    method: "POST",
    body: JSON.stringify({ agent_id: agentId, command, success })
  });
}

export function updateAgentLocation(agentId: string, lat: number, lng: number, speed = 0, batteryLevel = 100): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${NODE_API_BASE}/location/update`, {
    method: "POST",
    body: JSON.stringify({ agent_id: agentId, lat, lng, speed, battery_level: batteryLevel })
  });
}

export function getLiveLocation(agentId: string): Promise<{ lat: number; lng: number; speed: number; battery_level: number }> {
  return request<{ lat: number; lng: number; speed: number; battery_level: number }>(`${NODE_API_BASE}/location/live/${agentId}`);
}

export function reportIncident(report: IncidentReport): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`${NODE_API_BASE}/incidents/report`, {
    method: "POST",
    body: JSON.stringify(report)
  });
}

// Keep optimized route function mapped to priority stops for compatibility or backward reference
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
