import { prisma } from "@orakly/database";
import { Prisma } from "@prisma/client";
import { cacheManager } from "../cache/cacheManager.service.js";
import type { MarketProbabilityResult } from "../engines/probabilityEngine.service.js";

function toNum(d: Prisma.Decimal | null | undefined): number {
  if (!d) return 0;
  return Number(d);
}

function defaultSafeProbability(marketId: string): MarketProbabilityResult {
  return {
    marketId,
    probability: 0.5,
    probabilityPct: 50,
    ammRatio: 0.5,
    orderRatio: 0.5,
    forVolume: 0,
    againstVolume: 0,
    degraded: true,
    smoothed: false,
  };
}

async function loadDbSnapshot(
  marketId: string,
): Promise<MarketProbabilityResult | null> {
  const snap = await prisma.marketProbabilitySnapshot.findUnique({
    where: { marketId },
  });
  if (!snap) return null;

  return {
    marketId,
    probability: toNum(snap.probability),
    probabilityPct: toNum(snap.probabilityPct),
    ammRatio: toNum(snap.ammRatio),
    orderRatio: toNum(snap.orderRatio),
    forVolume: 0,
    againstVolume: 0,
    degraded: true,
    smoothed: false,
  };
}

export async function getMarketProbabilityFallback(
  marketId: string,
): Promise<MarketProbabilityResult> {
  try {
    const cached =
      await cacheManager.getMarket<MarketProbabilityResult>(marketId);
    if (cached) return cached;
  } catch {
    /* continue */
  }

  try {
    const snap = await loadDbSnapshot(marketId);
    if (snap) return snap;
  } catch {
    /* continue */
  }

  return defaultSafeProbability(marketId);
}

export async function getDashboardAttentionFallback<
  T extends { narrative: string; score: number },
>(): Promise<T[]> {
  try {
    const cached = await cacheManager.getDashboardAttention<T[]>();
    if (cached && cached.length > 0) return cached;
  } catch {
    /* continue */
  }

  try {
    const rows = await prisma.attentionScore.findMany({
      orderBy: { updatedAt: "desc" },
    });
    if (rows.length > 0) {
      return rows.map((r) => ({
        narrative: r.narrative,
        score: Number(r.score),
      })) as T[];
    }
  } catch {
    /* continue */
  }

  return [{ narrative: "DeFi", score: 50 }] as T[];
}

export async function withFallback<T>(
  fn: () => Promise<T>,
  fallback: () => Promise<T> | T,
): Promise<T> {
  try {
    return await fn();
  } catch {
    return await Promise.resolve(fallback());
  }
}
