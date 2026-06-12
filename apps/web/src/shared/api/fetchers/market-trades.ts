import { backendRequest } from "../backend-client";
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
  executedAt: string;
};

export async function fetchMarketTrades(
  marketId: string,
  take = 50,
): Promise<MarketTradeRowDto[]> {
  const res = await backendRequest<MarketTradeRowDto[]>(
    `/api/markets/${marketId}/trades?take=${take}`,
  );
  return unwrapApiResult(res);
}
