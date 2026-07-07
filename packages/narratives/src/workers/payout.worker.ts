import { prisma } from "@orakly/database";
import { LedgerEntryType, MarketStatus, Prisma } from "@prisma/client";
import { eventBus, SystemEvents } from "../events/eventBus.service.js";
import { recordFinancialEntry } from "../ledger.service.js";
import { syncPortfolioRealizedPnl } from "../engines/positionEngine.service.js";
import { withMarketLock } from "../infra/lock.service.js";
import { reconcileWalletFromLedger } from "../walletBalance.service.js";

function toDec(v: string | number): Prisma.Decimal {
  return new Prisma.Decimal(v);
}

export async function processMarketPayout(marketId: string): Promise<{
  marketId: string;
  payouts: number;
  totalUsd: string;
  skipped?: boolean;
}> {
  const locked = await withMarketLock(marketId, () =>
    processMarketPayoutInner(marketId),
  );

  if (locked === null) {
    console.info("[payout] skipped — lock held", marketId);
    return { marketId, payouts: 0, totalUsd: "0", skipped: true };
  }

  return locked;
}

async function processMarketPayoutInner(marketId: string): Promise<{
  marketId: string;
  payouts: number;
  totalUsd: string;
}> {
  const market = await prisma.market.findUnique({ where: { id: marketId } });
  if (!market || market.status !== MarketStatus.RESOLVED || !market.resolvedOutcome) {
    return { marketId, payouts: 0, totalUsd: "0" };
  }

  const meta = market.generationMeta as { payoutProcessed?: boolean } | null;
  if (meta?.payoutProcessed) {
    return { marketId, payouts: 0, totalUsd: "0" };
  }

  const positions = await prisma.position.findMany({
    where: { marketId },
    include: { portfolio: true },
  });

  let payouts = 0;
  let total = toDec(0);
  const ledgerEvents: Array<{
    userId: string;
    amount: Prisma.Decimal;
  }> = [];

  await prisma.$transaction(async (tx) => {
    for (const pos of positions) {
      const won = pos.side === market.resolvedOutcome;
      const payout = won ? pos.quantity.mul(1) : toDec(0);
      if (!won || payout.lessThanOrEqualTo(0)) continue;

      const userId = pos.portfolio.userId;
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) continue;

      const newBal = wallet.availableBalance.plus(payout);
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { availableBalance: newBal },
      });

      const balAfter = await reconcileWalletFromLedger(userId, tx);
      await recordFinancialEntry(tx, {
        userId,
        type: LedgerEntryType.PNL,
        amount: payout,
        portfolioId: pos.portfolioId,
        marketId,
        balanceAfter: toDec(balAfter.availableBalanceUsd),
        metadata: {
          side: pos.side,
          quantity: pos.quantity.toFixed(),
          outcome: market.resolvedOutcome,
          leg: "RESOLUTION_PAYOUT",
        },
      });
      ledgerEvents.push({ userId, amount: payout });

      payouts += 1;
      total = total.plus(payout);
    }

    await tx.market.update({
      where: { id: marketId },
      data: {
        generationMeta: {
          ...(typeof market.generationMeta === "object" && market.generationMeta
            ? market.generationMeta
            : {}),
          payoutProcessed: true,
          payoutTotalUsd: total.toFixed(),
          payoutAt: new Date().toISOString(),
        },
      },
    });
  });

  const userIds = new Set(positions.map((p) => p.portfolio.userId));
  for (const userId of userIds) {
    await syncPortfolioRealizedPnl(userId);
  }

  for (const evt of ledgerEvents) {
    await eventBus.emit(SystemEvents.LEDGER_UPDATED, {
      userId: evt.userId,
      type: LedgerEntryType.PNL,
      amount: evt.amount.toFixed(),
      txHash: null,
    });
  }

  return { marketId, payouts, totalUsd: total.toFixed() };
}

export async function runPayoutSafetyScan(): Promise<number> {
  const markets = await prisma.market.findMany({
    where: {
      status: MarketStatus.RESOLVED,
      resolvedOutcome: { not: null },
    },
    select: { id: true, generationMeta: true },
    take: 100,
  });

  let processed = 0;
  for (const m of markets) {
    const meta = m.generationMeta as { payoutProcessed?: boolean } | null;
    if (meta?.payoutProcessed) continue;
    const result = await processMarketPayout(m.id);
    if (!result.skipped) processed += 1;
  }
  return processed;
}
