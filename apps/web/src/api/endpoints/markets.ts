import type { Market } from "@orakly/types";
import { apiClient } from "@/api/client/http-client";
import type { ApiResult } from "@/api/types";

export function fetchMarketsV1(): Promise<ApiResult<Market[]>> {
  return apiClient.request<Market[]>("/api/v1/markets", { method: "GET" });
}
