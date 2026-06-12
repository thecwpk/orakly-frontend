import type { ApiResult } from "@/api/types";
import type { NarrativeTradeSide, UiTradeDirection } from "@/shared/trading/narrative-trade-side";
import { unwrapApiResult } from "../unwrap";
import { tradingActorHeaders } from "./trading-headers";

/** Canonical trade API body — `side` is FOR|AGAINST, not YES|NO. */
export type ExecuteTradeBody = {
  marketId: string;
  side: NarrativeTradeSide;
  direction: UiTradeDirection;
  quantity: string | number;
  clientSeq?: number;
  idempotencyKey?: string;
};

export type TradeExecutionSnapshotDto = {
  tradeId: string;
  marketId: string;
  outcome: "YES" | "NO";
  direction: UiTradeDirection;
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
  const headers = new Headers({
    "Content-Type": "application/json",
  });
  const actorHeaders = tradingActorHeaders();
  if (actorHeaders instanceof Headers) {
    actorHeaders.forEach((value, key) => headers.set(key, value));
  } else if (Array.isArray(actorHeaders)) {
    for (const [key, value] of actorHeaders) headers.set(key, value);
  } else {
    for (const [key, value] of Object.entries(actorHeaders)) {
      headers.set(key, value);
    }
  }
  if (body.idempotencyKey?.trim()) {
    headers.set("idempotency-key", body.idempotencyKey.trim());
  }

  const res = await fetch("/api/v1/trades", {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as ApiResult<TradeExecutionSnapshotDto>;
  return unwrapApiResult(json);
}
