import { apiClient } from "@/api/client/http-client";
import type { AttentionHistoryPayload } from "@/shared/contracts/attention-history";
import type { EnrichedMarketDto } from "@/shared/contracts/enriched-market";
import { unwrapApiResult } from "../unwrap";

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
  const res = await apiClient.request<EnrichedMarketDto[]>(
    `/api/v1/markets?narrative=${encodeURIComponent(narrative)}&limit=${limit}`,
  );
  return unwrapApiResult(res);
}
