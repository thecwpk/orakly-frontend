import { prisma } from "@orakly/database";
import { MarketStatus, OutcomeSide, Prisma } from "@prisma/client";
import { eventBus, SystemEvents } from "../events/eventBus.service.js";
import { withMarketLock } from "../infra/lock.service.js";
import { getMarketProbabilityFallback } from "../resilience/fallback.service.js";
import {
  analyzeMarketManipulation,
  applyWalletWeight,
} from "./manipulationEngine.service.js";
import { stabilizeProbability } from "./marketMaker.service.js";

export type MarketProbabilityResult = {
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

type Tx = Prisma.TransactionClient;

function toNum(d: Prisma.Decimal | null | undefined): number {
  if (!d) return 0;
  return Number(d);
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function weightedVolumes(
  trades: Array<{
    buyerId: string;
    outcome: OutcomeSide;
    notionalUsd: Prisma.Decimal;
    executedAt: Date;
  }>,
  manipulation: Awaited<ReturnType<typeof analyzeMarketManipulation>>,
): { forVol: number; againstVol: number; spike: boolean } {
  const totalRaw = trades.reduce((s, t) => s + toNum(t.notionalUsd), 0);

  let forVol = 0;
  let againstVol = 0;

  for (const t of trades) {
    let weight = toNum(t.notionalUsd);
    weight = applyWalletWeight(weight, t.buyerId, manipulation);

    if (t.outcome === OutcomeSide.YES) forVol += weight;
    else againstVol += weight;
  }

  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  const recent = trades
    .filter((t) => t.executedAt.getTime() >= fiveMinAgo)
    .reduce((s, t) => s + toNum(t.notionalUsd), 0);
  const older = totalRaw - recent;
  const spike = manipulation.volatile || (older > 0 && recent / older > 2.5);

  return { forVol, againstVol, spike };
}

async function loadPendingOrderVolumes(
  _marketId: string,
): Promise<{ forPending: number; againstPending: number }> {
  return { forPending: 0, againstPending: 0 };
}

export async function calculateMarketProbability(
  marketId: string,
  tx?: Tx,
): Promise<MarketProbabilityResult> {
  const db = tx ?? prisma;

  try {
    const market = await db.market.findUnique({ where: { id: marketId } });
    if (!market) {
      return getMarketProbabilityFallback(marketId);
    }

    const manipulation = tx
      ? {
          marketId,
          riskLevel: "NORMAL" as const,
          volatile: false,
          flaggedWallets: [] as string[],
          walletWeightMultiplier: new Map<string, number>(),
          throttledWallets: [] as string[],
        }
      : await analyzeMarketManipulation(marketId);

    const trades = await db.trade.findMany({
      where: { marketId },
      select: {
        buyerId: true,
        outcome: true,
        notionalUsd: true,
        executedAt: true,
      },
    });

    const { forVol, againstVol, spike } = weightedVolumes(trades, manipulation);
    const total = forVol + againstVol;
    const realVolume = toNum(market.volumeTotalUsd);
    const ammRatio = total > 0 ? clamp01(forVol / total) : 0.5;

    const pending = await loadPendingOrderVolumes(marketId);
    const pendingTotal = pending.forPending + pending.againstPending;
    const orderRatio =
      pendingTotal > 0
        ? clamp01(pending.forPending / pendingTotal)
        : ammRatio;

    let probability = clamp01(0.75 * ammRatio + 0.25 * orderRatio);
    probability = stabilizeProbability(probability, realVolume);

    const previous =
      market.probability != null
        ? toNum(market.probability)
        : market.yesPrice != null
          ? toNum(market.yesPrice)
          : 0.5;
    let smoothed = false;
    if (spike) {
      probability = clamp01(0.6 * probability + 0.4 * previous);
      smoothed = true;
    }

    const probabilityPct = Number((probability * 100).toFixed(4));

    return {
      marketId,
      probability,
      probabilityPct,
      ammRatio,
      orderRatio,
      forVolume: forVol,
      againstVolume: againstVol,
      degraded: false,
      smoothed,
    };
  } catch {
    return getMarketProbabilityFallback(marketId);
  }
}

export async function applyMarketProbability(
  marketId: string,
  tx?: Tx,
): Promise<MarketProbabilityResult> {
  const result = await calculateMarketProbability(marketId, tx);
  const db = tx ?? prisma;

  const probDec = new Prisma.Decimal(result.probability.toFixed(9));
  const noDec = new Prisma.Decimal(clamp01(1 - result.probability).toFixed(9));

  await db.market.update({
    where: { id: marketId },
    data: {
      probability: probDec,
      yesPrice: probDec,
      noPrice: noDec,
    },
  });

  await db.marketProbabilitySnapshot.upsert({
    where: { marketId },
    create: {
      marketId,
      probability: probDec,
      probabilityPct: new Prisma.Decimal(result.probabilityPct),
      ammRatio: new Prisma.Decimal(result.ammRatio.toFixed(9)),
      orderRatio: new Prisma.Decimal(result.orderRatio.toFixed(9)),
      degraded: result.degraded,
      payload: result,
    },
    update: {
      probability: probDec,
      probabilityPct: new Prisma.Decimal(result.probabilityPct),
      ammRatio: new Prisma.Decimal(result.ammRatio.toFixed(9)),
      orderRatio: new Prisma.Decimal(result.orderRatio.toFixed(9)),
      degraded: result.degraded,
      payload: result,
    },
  });

  if (!tx) {
    await eventBus.emit(SystemEvents.PROBABILITY_UPDATED, {
      marketId,
      result,
    });
  }

  return result;
}

export async function recomputeLiveMarketProbabilities(): Promise<{
  updated: number;
  skipped: number;
  errors: number;
}> {
  const markets = await prisma.market.findMany({
    where: { status: MarketStatus.OPEN },
    select: { id: true },
  });

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const m of markets) {
    try {
      const outcome = await withMarketLock(m.id, async () => {
        await applyMarketProbability(m.id);
        return true;
      });
      if (outcome === null) {
        skipped += 1;
        console.info("[probability] skipped — lock held", m.id);
      } else {
        updated += 1;
      }
    } catch (e) {
      errors += 1;
      console.warn("[probability] recompute failed", m.id, e);
    }
  }

  return { updated, skipped, errors };
}

export async function recomputeTopActiveMarkets(limit = 20): Promise<number> {
  const markets = await prisma.market.findMany({
    where: { status: MarketStatus.OPEN },
    orderBy: [{ volume24hUsd: "desc" }, { updatedAt: "desc" }],
    take: limit,
    select: { id: true },
  });

  let count = 0;
  for (const m of markets) {
    try {
      const outcome = await withMarketLock(m.id, async () => {
        await applyMarketProbability(m.id);
        return true;
      });
      if (outcome !== null) count += 1;
    } catch {
      /* keep going */
    }
  }
  return count;
}
