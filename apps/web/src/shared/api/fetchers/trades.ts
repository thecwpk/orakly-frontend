import { apiClient } from "@/api/client/http-client";
import { unwrapApiResult } from "../unwrap";
import { tradingActorHeaders } from "./trading-headers";

export type TradeRow = {
  id: string;
  marketId: string;
  outcome: "YES" | "NO";
  price: string;
  quantity: string;
  notionalUsd: string;
  buyerId: string;
  sellerId: string;
  feeBuyerUsd: string;
  feeSellerUsd: string;
  executedAt: string;
  side: "BUY" | "SELL";
  optimistic?: boolean;
};

export type TradesPage = {
  trades: TradeRow[];
  nextCursor: string | null;
};

export async function fetchTradesPage(params: {
  take?: number;
  cursor?: string | null;
}): Promise<TradesPage> {
  const sp = new URLSearchParams();
  if (params.take !== undefined) sp.set("take", String(params.take));
  if (params.cursor) sp.set("cursor", params.cursor);
  const q = sp.toString();
  const path = q ? `/api/v1/trades?${q}` : "/api/v1/trades";
  const res = await apiClient.request<TradesPage>(path, {
    headers: tradingActorHeaders(),
  });
  return unwrapApiResult(res);
}
