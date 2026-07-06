import { apiClient } from "@/api/client/http-client";
import { unwrapApiResult } from "@/shared/api/unwrap";

export type RecordOnChainTradeBody = {
  marketId: string;
  txHash: string;
  outcome: "YES" | "NO";
  direction: "BUY" | "SELL";
  price: string;
  quantity: string;
  notionalUsd: string;
  feeUsd?: string;
};

export type RecordOnChainTradeResult = {
  tradeId: string;
  marketId: string;
};

/** Best-effort — requires wallet SIWE session cookie. */
export async function recordOnChainTrade(
  body: RecordOnChainTradeBody,
): Promise<RecordOnChainTradeResult | null> {
  const res = await apiClient.request<RecordOnChainTradeResult>("/api/v1/trades/on-chain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  return unwrapApiResult(res);
}
