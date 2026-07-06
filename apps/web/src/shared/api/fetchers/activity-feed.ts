import type { FeedActivityPayload } from "@orakly/realtime-protocol";
import { apiClient } from "@/api/client/http-client";
import { unwrapApiResult } from "../unwrap";

export async function fetchActivityFeed(input?: {
  take?: number;
}): Promise<FeedActivityPayload[]> {
  const sp = new URLSearchParams();
  if (input?.take) sp.set("take", String(input.take));
  const q = sp.toString();
  const res = await apiClient.request<FeedActivityPayload[]>(
    `/api/v1/activity/feed${q ? `?${q}` : ""}`,
  );
  return unwrapApiResult(res);
}
