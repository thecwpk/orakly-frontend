import { apiClient } from "@/api/client/http-client";
import type { CreatorProfileStats } from "@/shared/contracts/creator-profile";
import { unwrapApiResult } from "../unwrap";

export async function fetchCreatorStats(address: string): Promise<CreatorProfileStats> {
  const encoded = encodeURIComponent(address.trim().toLowerCase());
  const res = await apiClient.request<CreatorProfileStats>(
    `/api/v1/profile/${encoded}/creator-stats`,
  );
  return unwrapApiResult(res);
}
