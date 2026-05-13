import { apiClient } from "@/api/client/http-client";
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
  /** Populated when RPC env + linked `User.walletAddress` are configured. */
  onChain: PortfolioOnChainSnapshot | null;
};

export async function fetchPortfolio(): Promise<PortfolioSnapshot> {
  const res = await apiClient.request<PortfolioSnapshot>("/api/v1/portfolio", {
    headers: tradingActorHeaders(),
  });
  return unwrapApiResult(res);
}
