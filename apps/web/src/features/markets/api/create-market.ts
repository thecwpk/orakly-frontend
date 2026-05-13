import type { Market } from "@orakly/types";
import { apiClient } from "@/api/client/http-client";
import type { CreateMarketPayload } from "@/api/schemas/create-market";
import type { ApiResult } from "@/api/types";

export function createMarketRequest(
  payload: CreateMarketPayload,
): Promise<ApiResult<Market>> {
  return apiClient.request<Market>("/api/v1/markets/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
