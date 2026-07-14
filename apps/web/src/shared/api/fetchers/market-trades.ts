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
  time?: string;
  walletAddress?: string | null;
  sideOutcome?: "YES" | "NO";
  amount?: number;
  shares?: number;
  txHash?: string | null;
};

export async function fetchMarketTrades(
  marketId: string,
  take = 50,
  skip = 0,
): Promise<MarketTradeRowDto[]> {
  const res = await apiClient.request<MarketTradeRowDto[]>(
    `/api/v1/markets/${marketId}/trades?take=${take}&skip=${skip}`,
  );
  return unwrapApiResult(res);
}
