import { apiGet, apiPost } from "@/lib/api";

export interface AnomalyInput {
  tracking_id: string;
  inactive_hours: number;
  current_hub: string;
  expected_transition_hours?: number;
}

export interface AnomalyResponse {
  anomaly_detected: boolean;
  anomaly_score: number;
  issue_type: string;
  severity: string;
  recommendation: string;
}

export function detectAnomaly(payload: AnomalyInput): Promise<AnomalyResponse> {
  return apiPost<AnomalyResponse>("/detect-anomaly", payload);
}

export function getAllAnomalies(): Promise<any[]> {
  return apiGet<any[]>("/anomalies");
}
