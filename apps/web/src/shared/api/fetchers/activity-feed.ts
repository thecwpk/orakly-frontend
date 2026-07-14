import type { FeedActivityPayload } from "@orakly/realtime-protocol";
import { apiClient } from "@/api/client/http-client";
import type { MarketActivityEvent } from "@/shared/contracts/market-activity";
import { marketActivityToFeedPayload } from "@/shared/lib/market-activity-map";
import { unwrapApiResult } from "../unwrap";

export async function fetchMarketActivityFeed(
  limit = 10,
): Promise<MarketActivityEvent[]> {
  const sp = new URLSearchParams({ limit: String(limit) });
  const res = await apiClient.request<MarketActivityEvent[]>(
    `/api/v1/activity/feed?${sp.toString()}`,
  );
  return unwrapApiResult(res);
}

/** Tape HTTP fallback — maps hub events into Socket.IO payload shape. */
export async function fetchActivityFeed(input?: {
  take?: number;
}): Promise<FeedActivityPayload[]> {
  const events = await fetchMarketActivityFeed(input?.take ?? 40);
  return events.map(marketActivityToFeedPayload);
}
