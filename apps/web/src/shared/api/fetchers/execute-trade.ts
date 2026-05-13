import type { ApiResult } from "@/api/types";
import { unwrapApiResult } from "../unwrap";
import { tradingActorHeaders } from "./trading-headers";

export type ExecuteTradeBody = {
  marketId: string;
  outcome: "YES" | "NO";
  direction: "BUY" | "SELL";
  quantity: string | number;
  clientSeq?: number;
  idempotencyKey?: string;
};

export type TradeExecutionSnapshotDto = {
  tradeId: string;
  marketId: string;
  outcome: "YES" | "NO";
  direction: "BUY" | "SELL";
  executedPrice: string;
  quantity: string;
  notionalUsd: string;
  feeUsd: string;
  walletAvailableUsd: string;
  odds: { yesPrice: string; noPrice: string };
  liquidityUsd: string;
  collateralPoolUsd: string;
  volumeTotalUsd: string;
  volume24hUsd: string;
  clientSeq?: number;
};

export async function postExecuteTrade(
  body: ExecuteTradeBody,
): Promise<TradeExecutionSnapshotDto> {
  const res = await fetch("/api/v1/trades", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...tradingActorHeaders(),
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as ApiResult<TradeExecutionSnapshotDto>;
  return unwrapApiResult(json);
}
