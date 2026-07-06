import { apiClient } from "@/api/client/http-client";
import type { AnalyticsHistoryPayload } from "@/shared/contracts/analytics-history";
import { unwrapApiResult } from "../unwrap";

export async function fetchAnalyticsHistory(input: {
  from: string;
  to: string;
  narrative?: string;
  category?: string;
}): Promise<AnalyticsHistoryPayload> {
  const sp = new URLSearchParams();
  sp.set("from", input.from);
  sp.set("to", input.to);
  if (input.narrative && input.narrative !== "all") {
    sp.set("narrative", input.narrative);
  }
  if (input.category && input.category !== "all") {
    sp.set("category", input.category);
  }

  const res = await apiClient.request<AnalyticsHistoryPayload>(
    `/api/v1/analytics/history?${sp.toString()}`,
  );
  return unwrapApiResult(res);
}
