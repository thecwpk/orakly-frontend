import {
  ActivityType,
  MarketStatus,
  type OutcomeSide,
  Prisma,
  TransactionType,
} from "@prisma/client";
import { prisma } from "@orakly/database";
import {
  createRewardNotification,
  createSettlementNotification,
} from "../notifications/create-notification";
import {
  BPS_DENOMINATOR,
  D0,
  D1,
  MIN_PRICE,
  PLATFORM_RESOLUTION_BPS,
  clampPrice,
  toDec,
} from "./constants";
import { TradingError } from "./errors";
import { ensurePlatformLiquidityUserId } from "./platform-user";
import { ensureWalletAndPortfolio } from "./user-setup";
import { creditAvailableBalance } from "./wallet-ledger";
import { publishMarketResolved } from "../realtime/notify";

export type ResolveMarketInput = {
  marketId: string;
  outcome: OutcomeSide;
  resolvedByUserId?: string | null;
};

export type ResolutionSnapshot = {
  marketId: string;
  outcome: OutcomeSide;
  collateralPoolUsd: string;
  platformCreditUsd: string;
  winnersCreditUsd: string;
  winningPositionsSettled: number;
  /** Distinct users who held any position before cleanup — for portfolio refresh pushes. */
  affectedUserIds: string[];
};

/**
 * Locks the market, distributes `collateralPoolUsd` as 75% platform / 25% winning outcome holders,
 * credits wallets, writes ledger rows, deletes positions, clears the pool.
 */
export async function resolveMarket(
  input: ResolveMarketInput,
): Promise<ResolutionSnapshot> {
  const platformUserId = await ensurePlatformLiquidityUserId();

  const result = await prisma.$transaction(
    async (tx) => {
      const market = await tx.market.findUnique({
        where: { id: input.marketId },
      });

      if (!market) {
        throw new TradingError("NOT_FOUND", "Market not found", 404);
      }

      if (market.status === MarketStatus.RESOLVED) {
        throw new TradingError(
          "ALREADY_RESOLVED",
          "Market is already resolved",
          409,
        );
      }

      if (
        market.status === MarketStatus.VOID ||
        market.status === MarketStatus.DRAFT
      ) {
        throw new TradingError(
          "INVALID_STATE",
          "Market cannot be resolved from this status",
          400,
        );
      }

      const pool = market.collateralPoolUsd;
      const platformCut = pool
        .mul(toDec(PLATFORM_RESOLUTION_BPS))
        .div(toDec(BPS_DENOMINATOR));
      const winnerPool = pool.minus(platformCut);

      const winners = await tx.position.findMany({
        where: { marketId: input.marketId, side: input.outcome },
        include: {
          portfolio: { include: { user: true } },
        },
      });

      const sorted = [...winners].sort((a, b) => a.id.localeCompare(b.id));
      const totalWinnerQty = sorted.reduce(
        (acc, p) => acc.plus(p.quantity),
        D0,
      );

      const winnerPayouts: Array<{
        userId: string;
        walletAddress: string | null;
        amount: number;
      }> = [];

      await tx.market.update({
        where: { id: input.marketId },
        data: {
          status: MarketStatus.RESOLVED,
          resolvedOutcome: input.outcome,
          resolvedAt: new Date(),
          yesPrice:
            input.outcome === "YES" ? D1 : clampPrice(MIN_PRICE),
          noPrice:
            input.outcome === "NO" ? D1 : clampPrice(MIN_PRICE),
          collateralPoolUsd: D0,
        },
      });

      const platformWp = await ensureWalletAndPortfolio(tx, platformUserId);

      let platformCreditUsd = platformCut;
      let winnersCreditUsd = new Prisma.Decimal(0);

      if (totalWinnerQty.greaterThan(0)) {
        const platBal = await creditAvailableBalance(
          tx,
          platformWp.wallet.id,
          platformCut,
        );
        await tx.transaction.create({
          data: {
            userId: platformUserId,
            marketId: input.marketId,
            type: TransactionType.ADJUSTMENT,
            amountUsd: platformCut,
            balanceAfter: platBal,
            metadata: {
              kind: "resolution_platform_share",
              platformBps: PLATFORM_RESOLUTION_BPS,
              outcome: input.outcome,
            },
          },
        });

        let remaining = winnerPool;
        for (let i = 0; i < sorted.length; i++) {
          const pos = sorted[i]!;
          const isLast = i === sorted.length - 1;
          const payout =
            isLast ? remaining : winnerPool.mul(pos.quantity).div(totalWinnerQty);
          remaining = remaining.minus(payout);
          winnersCreditUsd = winnersCreditUsd.plus(payout);

          const uid = pos.portfolio.userId;
          const userWp = await ensureWalletAndPortfolio(tx, uid);
          const bal = await creditAvailableBalance(
            tx,
            userWp.wallet.id,
            payout,
          );

          await tx.transaction.create({
            data: {
              userId: uid,
              portfolioId: pos.portfolioId,
              marketId: input.marketId,
              type: TransactionType.RESOLUTION_PAYOUT,
              amountUsd: payout,
              balanceAfter: bal,
              metadata: {
                outcome: input.outcome,
                shares: pos.quantity.toFixed(),
              },
            },
          });

          winnerPayouts.push({
            userId: uid,
            walletAddress: pos.portfolio.user.walletAddress,
            amount: Number(payout.toFixed(8)),
          });
        }
      } else {
        platformCreditUsd = pool;
        const platBal = await creditAvailableBalance(
          tx,
          platformWp.wallet.id,
          pool,
        );
        await tx.transaction.create({
          data: {
            userId: platformUserId,
            marketId: input.marketId,
            type: TransactionType.ADJUSTMENT,
            amountUsd: pool,
            balanceAfter: platBal,
            metadata: {
              kind: "resolution_platform_full_pool_no_winners",
              outcome: input.outcome,
            },
          },
        });
      }

      const allHolders = await tx.position.findMany({
        where: { marketId: input.marketId },
        select: { portfolio: { select: { userId: true } } },
      });
      const affectedUserIds = [
        ...new Set(allHolders.map((p) => p.portfolio.userId)),
      ];

      await tx.position.deleteMany({
        where: { marketId: input.marketId },
      });

      await tx.activity.create({
        data: {
          type: ActivityType.MARKET_RESOLVED,
          userId: input.resolvedByUserId ?? null,
          marketId: input.marketId,
          title: `Resolved ${input.outcome}`,
          payload: {
            outcome: input.outcome,
            pool: pool.toFixed(),
            platformCreditUsd: platformCreditUsd.toFixed(),
            winnersCreditUsd: winnersCreditUsd.toFixed(),
            winnersCount: sorted.length,
          },
        },
      });

      for (const winner of winnerPayouts) {
        await createSettlementNotification({
          db: tx,
          userId: winner.userId,
          walletAddress: winner.walletAddress,
          marketId: input.marketId,
          marketTitle: market.title,
          marketSlug: market.slug,
          amountBnb: winner.amount,
        });
      }

      const creatorRewardPct = market.creatorRewardPercent ?? 0;
      const creatorFees =
        (Number(market.volumeTotalUsd) * creatorRewardPct) / 100;
      if (market.creatorAddress && creatorFees > 0) {
        await createRewardNotification({
          db: tx,
          walletAddress: market.creatorAddress,
          marketId: input.marketId,
          marketTitle: market.title,
          marketSlug: market.slug,
          amountBnb: Number(creatorFees.toFixed(8)),
        });
      }

      return {
        marketId: input.marketId,
        outcome: input.outcome,
        collateralPoolUsd: pool.toFixed(),
        platformCreditUsd: platformCreditUsd.toFixed(),
        winnersCreditUsd: winnersCreditUsd.toFixed(),
        winningPositionsSettled: sorted.length,
        affectedUserIds,
      };
    },
    { maxWait: 5_000, timeout: 30_000 },
  );

  publishMarketResolved(result, result.affectedUserIds);
  return result;
}
