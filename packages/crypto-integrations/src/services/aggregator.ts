import {
  CRYPTO_MARKET_CATEGORIES,
  CRYPTO_SIGNAL_CATEGORIES,
  type CryptoMarketCategory,
} from "../types/categories";
import type { NormalizedCryptoAsset } from "../types/normalized";

export function mergeNormalizedAssets(
  a: NormalizedCryptoAsset,
  b: NormalizedCryptoAsset,
): NormalizedCryptoAsset {
  const providers = [...new Set([...a.providers, ...b.providers])];
  const categoryScores: Partial<Record<CryptoMarketCategory, number>> = {
    ...a.categoryScores,
  };
  for (const cat of CRYPTO_MARKET_CATEGORIES) {
    const av = a.categoryScores[cat];
    const bv = b.categoryScores[cat];
    if (av !== undefined || bv !== undefined) {
      categoryScores[cat] = Math.max(av ?? 0, bv ?? 0);
    }
  }

  return {
    dedupeKey: a.dedupeKey,
    chainId: a.chainId ?? b.chainId,
    tokenAddress: a.tokenAddress ?? b.tokenAddress,
    coingeckoId: a.coingeckoId ?? b.coingeckoId,
    symbol: a.symbol ?? b.symbol,
    name: a.name ?? b.name,
    priceUsd: coalesce(a.priceUsd, b.priceUsd),
    liquidityUsd: coalesceMax(a.liquidityUsd, b.liquidityUsd),
    volume24hUsd: coalesceMax(a.volume24hUsd, b.volume24hUsd),
    fdvUsd: coalesceMax(a.fdvUsd, b.fdvUsd),
    change24hPct: coalesce(a.change24hPct, b.change24hPct),
    pairCreatedAtMs: mergePairCreated(a.pairCreatedAtMs, b.pairCreatedAtMs),
    imageUrl: a.imageUrl ?? b.imageUrl,
    pairAddress: a.pairAddress ?? b.pairAddress,
    dexId: a.dexId ?? b.dexId,
    providers,
    categoryScores,
    fetchedAt: a.fetchedAt > b.fetchedAt ? a.fetchedAt : b.fetchedAt,
  };
}

function coalesce<T>(x: T | null, y: T | null): T | null {
  return x ?? y ?? null;
}

function coalesceMax(a: number | null, b: number | null): number | null {
  if (a == null) return b;
  if (b == null) return a;
  return Math.max(a, b);
}

function mergePairCreated(a: number | null, b: number | null): number | null {
  if (a == null) return b;
  if (b == null) return a;
  return Math.max(a, b);
}

function maxLeaderboardSignal(a: NormalizedCryptoAsset): number {
  let m = a.categoryScores.trending_all ?? 0;
  for (const cat of CRYPTO_SIGNAL_CATEGORIES) {
    m = Math.max(m, a.categoryScores[cat] ?? 0);
  }
  return m;
}

export function buildCategorizedLeaderboards(
  merged: NormalizedCryptoAsset[],
): Record<CryptoMarketCategory, NormalizedCryptoAsset[]> {
  const byCategory = {} as Record<CryptoMarketCategory, NormalizedCryptoAsset[]>;

  for (const cat of CRYPTO_SIGNAL_CATEGORIES) {
    byCategory[cat] = merged
      .filter((a) => (a.categoryScores[cat] ?? 0) > 0)
      .sort(
        (x, y) =>
          (y.categoryScores[cat] ?? 0) - (x.categoryScores[cat] ?? 0),
      )
      .slice(0, 60);
  }

  byCategory.trending_all = [...merged]
    .sort((x, y) => maxLeaderboardSignal(y) - maxLeaderboardSignal(x))
    .slice(0, 80);

  return byCategory;
}
