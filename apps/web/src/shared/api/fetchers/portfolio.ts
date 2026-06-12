import { backendRequest } from "../backend-client";
import { unwrapApiResult } from "../unwrap";
import { tradingActorHeaders } from "./trading-headers";

export type PortfolioOnChainSnapshot = {
  chainId: number;
  walletAddress: string;
  syncedAt: string | null;
  balances: Array<{
    tokenAddress: string;
    isNative: boolean;
    symbol: string;
    decimals: number;
    formattedBalance: string;
    rawBalance: string;
  }>;
};

export type PortfolioSnapshot = {
  wallet: {
    availableBalanceUsd: string;
    lockedBalanceUsd: string;
  } | null;
  positions: Array<{
    marketId: string;
    side: "YES" | "NO";
    quantity: string;
    avgEntryPrice: string;
    market: {
      id: string;
      title: string;
      slug: string;
      status: string;
      yesPrice: string | null;
      noPrice: string | null;
      liquidityUsd: string;
      collateralPoolUsd: string;
    };
  }>;
  realizedPnlUsd: string;
  onChain: PortfolioOnChainSnapshot | null;
};

export async function fetchPortfolio(userId?: string): Promise<PortfolioSnapshot> {
  const sp = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  const res = await backendRequest<PortfolioSnapshot>(`/portfolio${sp}`, {
    headers: tradingActorHeaders(),
  });
  const data = unwrapApiResult(res);
  return { ...data, onChain: data.onChain ?? null };
}
