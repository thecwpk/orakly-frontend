import { apiClient } from "@/api/client/http-client";
import type { AttentionHistoryPayload } from "@/shared/contracts/attention-history";
import type { EnrichedMarketDto } from "@/shared/contracts/enriched-market";
import { unwrapApiResult } from "../unwrap";

export type NarrativeCommentDto = {
  id: string;
  body: string;
  walletAddress: string | null;
  createdAt: string;
  narrativeSlug: string;
};

export type NarrativeTimelineEventDto = {
  id: string;
  at: string;
  kind: string;
  description: string;
};

export async function fetchAttentionHistory(
  narrative: string,
  period: AttentionHistoryPayload["period"],
): Promise<AttentionHistoryPayload> {
  const res = await apiClient.request<AttentionHistoryPayload>(
    `/api/v1/attention/history?narrative=${encodeURIComponent(narrative)}&period=${period}`,
  );
  return unwrapApiResult(res);
}

export async function fetchNarrativeMarkets(
  narrative: string,
  limit = 20,
): Promise<EnrichedMarketDto[]> {
  const sp = new URLSearchParams({
    narrative,
    sort: "volume",
    limit: String(limit),
  });
  const res = await apiClient.request<EnrichedMarketDto[]>(
    `/api/v1/markets?${sp.toString()}`,
  );
  return unwrapApiResult(res);
}

export async function fetchNarrativeTimeline(
  narrative: string,
  limit = 20,
): Promise<NarrativeTimelineEventDto[]> {
  const res = await apiClient.request<NarrativeTimelineEventDto[]>(
    `/api/v1/activity/feed?narrative=${encodeURIComponent(narrative)}&limit=${limit}`,
  );
  return unwrapApiResult(res);
}

export async function fetchNarrativeComments(
  slug: string,
  take = 50,
): Promise<NarrativeCommentDto[]> {
  const enc = encodeURIComponent(slug);
  const res = await apiClient.request<NarrativeCommentDto[]>(
    `/api/v1/narratives/${enc}/comments?take=${take}`,
  );
  return unwrapApiResult(res);
}

export async function postNarrativeComment(
  slug: string,
  body: string,
): Promise<NarrativeCommentDto> {
  const enc = encodeURIComponent(slug);
  const res = await apiClient.request<NarrativeCommentDto>(
    `/api/v1/narratives/${enc}/comments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ body }),
    },
  );
  return unwrapApiResult(res);
}
