import type { Market } from "@orakly/types";
import { apiClient } from "@/api/client/http-client";
import type {
  NarrativeTradeSide,
  UiTradeDirection,
} from "@/shared/trading/narrative-trade-side";
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

export type MarketVolumeWindowRowDto = {
  at: number;
  label: string;
  buy: number;
  sell: number;
  cumulative: number;
};

export type MarketVolumeWindowDto = {
  slug: string;
  marketId: string;
  generatedAt: number;
  totalUsd: number;
  buyUsd: number;
  sellUsd: number;
  imbalance: number;
  rows: MarketVolumeWindowRowDto[];
};

export type MarketOddsHistoryPointDto = {
  yes: number;
  recordedAt: string;
};

export async function fetchMarketBySlug(slug: string): Promise<Market> {
  const enc = encodeURIComponent(slug);
  const res = await apiClient.request<Market>(`/api/v1/markets/by-slug/${enc}`);
  return unwrapApiResult(res);
}

export async function fetchMarketVolumeWindowBySlug(
  slug: string,
): Promise<MarketVolumeWindowDto> {
  const enc = encodeURIComponent(slug);
  const res = await apiClient.request<MarketVolumeWindowDto>(
    `/api/v1/markets/by-slug/${enc}/volume-window`,
  );
  return unwrapApiResult(res);
}

export async function fetchMarketOdds(marketId: string): Promise<MarketOddsDto> {
  const res = await apiClient.request<MarketOddsDto>(
    `/api/v1/markets/${marketId}/odds`,
  );
  return unwrapApiResult(res);
}

export async function fetchMarketOddsHistory(
  marketId: string,
  hours = 168,
): Promise<MarketOddsHistoryPointDto[]> {
  const res = await apiClient.request<MarketOddsHistoryPointDto[]>(
    `/api/v1/markets/${marketId}/odds-history?hours=${hours}`,
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
    side: NarrativeTradeSide;
    direction: UiTradeDirection;
    quantity: string;
  },
): Promise<MarketQuoteDto> {
  const sp = new URLSearchParams({
    side: params.side,
    direction: params.direction,
    quantity: params.quantity,
  });
  const res = await apiClient.request<MarketQuoteDto>(
    `/api/v1/markets/${marketId}/quote?${sp.toString()}`,
  );
  return unwrapApiResult(res);
}
