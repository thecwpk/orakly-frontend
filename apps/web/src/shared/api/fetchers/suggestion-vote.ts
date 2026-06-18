import { apiClient } from "@/api/client/http-client";
import { unwrapApiResult } from "../unwrap";

export async function voteMarketSuggestion(
  suggestionId: string,
  direction: "UP" | "DOWN",
): Promise<{ id: string; votesUp: number; votesDown: number }> {
  const res = await apiClient.request<{ id: string; votesUp: number; votesDown: number }>(
    `/api/v1/markets/suggestions/${suggestionId}/vote`,
    { method: "POST", body: JSON.stringify({ direction }) },
  );
  return unwrapApiResult(res);
}
