import type { HubMarketsPreviewPayload } from "@/shared/contracts/hub-markets-preview";
import { apiClient } from "@/api/client/http-client";
import { unwrapApiResult } from "../unwrap";

export async function fetchHubMarketsPreview(): Promise<HubMarketsPreviewPayload> {
  const res = await apiClient.request<HubMarketsPreviewPayload>("/api/v1/markets/hub-preview");
  return unwrapApiResult(res);
}
