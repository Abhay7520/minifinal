import { apiPost } from "@/lib/api";
import type { PredictEtaRequest, PredictEtaResponse } from "@/types/eta";

export function predictEta(payload: PredictEtaRequest): Promise<PredictEtaResponse> {
  return apiPost<PredictEtaResponse>("/predict-eta", payload);
}
