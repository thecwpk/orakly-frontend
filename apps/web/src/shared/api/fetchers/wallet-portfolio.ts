import { apiClient } from "@/api/client/http-client";
import { unwrapApiResult } from "../unwrap";

export type PortfolioOverviewDto = {
  portfolioBalanceBnb: number;
  totalPnlBnb: number;
  totalPnlPct: number;
  openPositionsCount: number;
  pendingSettlementCount: number;
  pendingSettlementBnb: number;
};

export type PortfolioPositionRowDto = {
  id: string;
  marketId: string;
  marketSlug: string;
  marketTitle: string;
  side: "YES" | "NO";
  entryPrice: number;
  currentOdds: number;
  shares: number;
  currentValueBnb: number;
  estPayoutBnb: number;
  result: "WON" | "LOST" | null;
  exitPrice: number | null;
  pnlBnb: number | null;
  closedAt: string | null;
  claimableBnb: number | null;
  onChainAddress: string | null;
  resolvedOutcome: "YES" | "NO" | null;
  marketStatus: string;
  narrative: string | null;
};

export type PortfolioPageDto = {
  address: string;
  overview: PortfolioOverviewDto;
  openPositions: PortfolioPositionRowDto[];
  closedPositions: PortfolioPositionRowDto[];
  claimablePositions: PortfolioPositionRowDto[];
  pnlSeries: Array<{ at: string; pnl: number }>;
  analytics: {
    wins: number;
    losses: number;
    winRatePct: number;
    narrativeTrades: Array<{ narrative: string; count: number }>;
    bestTrade: {
      marketTitle: string;
      marketSlug: string;
      pnlBnb: number;
      side: "YES" | "NO";
    } | null;
  };
};

export async function fetchWalletPortfolio(
  address: string,
  status?: "open" | "closed" | "claimable",
): Promise<PortfolioPageDto> {
  const sp = new URLSearchParams({ address });
  if (status) sp.set("status", status);
  const res = await apiClient.request<PortfolioPageDto>(
    `/api/v1/portfolio?${sp.toString()}`,
  );
  return unwrapApiResult(res);
}
