import { apiClient } from "@/api/client/http-client";
import { unwrapApiResult } from "../unwrap";

export type MarketOddsDto = {
  id: string;
  title: string;
  slug: string;
  status: string;
  yesPrice: string | null;
  noPrice: string | null;
  liquidityUsd: string;
  collateralPoolUsd: string;
  volume24hUsd: string;
  volumeTotalUsd: string;
  takerFeeBps: number;
  closesAt: string | null;
};

export async function fetchMarketOdds(marketId: string): Promise<MarketOddsDto> {
  const res = await apiClient.request<MarketOddsDto>(
    `/api/v1/markets/${marketId}/odds`,
  );
  return unwrapApiResult(res);
}

export type MarketQuoteDto = {
  marketId: string;
  tradableHint: boolean;
  execPrice: string;
  impliedYesAfter: string;
  impliedNoAfter: string;
  notionalUsd: string;
  feeUsd: string;
  totalDebitUsd?: string;
  netCreditUsd?: string;
  takerFeeBps: number;
};

export async function fetchMarketQuote(
  marketId: string,
  params: {
    outcome: "YES" | "NO";
    direction: "BUY" | "SELL";
    quantity: string;
  },
): Promise<MarketQuoteDto> {
  const sp = new URLSearchParams({
    outcome: params.outcome,
    direction: params.direction,
    quantity: params.quantity,
  });
  const res = await apiClient.request<MarketQuoteDto>(
    `/api/v1/markets/${marketId}/quote?${sp.toString()}`,
  );
  return unwrapApiResult(res);
}
