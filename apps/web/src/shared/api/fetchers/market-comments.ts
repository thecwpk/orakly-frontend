import { apiClient } from "@/api/client/http-client";
import type { MarketCommentDto } from "@/shared/contracts/market-detail";
import { unwrapApiResult } from "../unwrap";

export async function fetchMarketComments(
  marketId: string,
  take = 50,
): Promise<MarketCommentDto[]> {
  const res = await apiClient.request<MarketCommentDto[]>(
    `/api/v1/markets/${marketId}/comments?take=${take}`,
  );
  return unwrapApiResult(res);
}

export async function postMarketComment(
  marketId: string,
  body: string,
): Promise<MarketCommentDto> {
  const res = await apiClient.request<MarketCommentDto>(
    `/api/v1/markets/${marketId}/comments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ body }),
    },
  );
  return unwrapApiResult(res);
}
