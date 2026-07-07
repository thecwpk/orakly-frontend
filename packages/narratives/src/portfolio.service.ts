import { prisma } from "@orakly/database";
import { cacheManager } from "./cache/cacheManager.service.js";
import { computeWalletBalanceComponents } from "./walletBalance.service.js";

export type PortfolioSnapshotDto = {
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
  onChain: null;
};

export type WalletBalanceDto = {
  userId: string;
  availableBalanceUsd: string;
  lockedBalanceUsd: string;
  totalBalanceUsd: string;
  depositsUsd: string;
  withdrawalsUsd: string;
  openPositionsValueUsd: string;
  realizedPnlUsd: string;
};

export async function getUserPortfolioSnapshot(
  userId: string,
): Promise<PortfolioSnapshotDto> {
  const [balance, portfolio] = await Promise.all([
    computeWalletBalanceComponents(userId),
    prisma.portfolio.findUnique({
      where: { userId },
      include: {
        positions: {
          include: {
            market: {
              select: {
                id: true,
                title: true,
                slug: true,
                status: true,
                yesPrice: true,
                noPrice: true,
                liquidityUsd: true,
                collateralPoolUsd: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    wallet: {
      availableBalanceUsd: balance.availableBalanceUsd,
      lockedBalanceUsd: balance.lockedBalanceUsd,
    },
    positions:
      portfolio?.positions.map((p) => ({
        marketId: p.marketId,
        side: p.side,
        quantity: p.quantity.toFixed(),
        avgEntryPrice: p.avgEntryPrice.toFixed(),
        market: {
          ...p.market,
          yesPrice: p.market.yesPrice?.toFixed() ?? null,
          noPrice: p.market.noPrice?.toFixed() ?? null,
          liquidityUsd: p.market.liquidityUsd.toFixed(),
          collateralPoolUsd: p.market.collateralPoolUsd.toFixed(),
        },
      })) ?? [],
    realizedPnlUsd: portfolio?.realizedPnlUsd.toFixed() ?? "0",
    onChain: null,
  };
}

export async function getWalletBalance(userId: string): Promise<WalletBalanceDto> {
  const cached = await cacheManager.getWalletBalance<WalletBalanceDto>(userId);
  if (cached) return cached;

  const balance = await computeWalletBalanceComponents(userId);
  const dto: WalletBalanceDto = {
    userId: balance.userId,
    availableBalanceUsd: balance.availableBalanceUsd,
    lockedBalanceUsd: balance.lockedBalanceUsd,
    totalBalanceUsd: balance.totalBalanceUsd,
    depositsUsd: balance.depositsUsd,
    withdrawalsUsd: balance.withdrawalsUsd,
    openPositionsValueUsd: balance.openPositionsValueUsd,
    realizedPnlUsd: balance.realizedPnlUsd,
  };
  await cacheManager.setWalletBalance(userId, dto);
  return dto;
}
