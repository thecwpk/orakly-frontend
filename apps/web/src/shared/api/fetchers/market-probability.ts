import { backendRequest } from "../backend-client";
import { unwrapApiResult } from "../unwrap";

export type MarketProbabilityDto = {
  marketId: string;
  probability: number;
  probabilityPct: number;
  ammRatio: number;
  orderRatio: number;
  forVolume: number;
  againstVolume: number;
  degraded: boolean;
  smoothed: boolean;
};

export async function fetchMarketProbability(
  marketId: string,
): Promise<MarketProbabilityDto> {
  const res = await backendRequest<MarketProbabilityDto>(
    `/api/markets/${marketId}/probability`,
  );
  return unwrapApiResult(res);
}
