import { apiClient } from "@/api/client/http-client";
import { unwrapApiResult } from "../unwrap";

export type MarketTradeRowDto = {
  id: string;
  marketId: string;
  outcome: "YES" | "NO";
  price: string;
  quantity: string;
  notionalUsd: string;
  buyerId: string;
  sellerId: string;
  side?: "BUY" | "SELL";
  executedAt: string;
};

export async function fetchMarketTrades(
  marketId: string,
  take = 50,
): Promise<MarketTradeRowDto[]> {
  const res = await apiClient.request<MarketTradeRowDto[]>(
    `/api/v1/markets/${marketId}/trades?take=${take}`,
  );
  return unwrapApiResult(res);
}
