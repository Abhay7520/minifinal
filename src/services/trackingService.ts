import { apiGet, apiPost } from "@/lib/api";
import type { TrackingResponse } from "@/types/tracking";

export function getTrackingInfo(trackingId: string): Promise<TrackingResponse> {
  return apiGet<TrackingResponse>(`/tracking/${trackingId}`);
}

export function advanceTrackingStage(trackingId: string): Promise<{ message: string; stage: number }> {
  return apiPost<{ message: string; stage: number }>(`/tracking/${trackingId}/advance`, {});
}
