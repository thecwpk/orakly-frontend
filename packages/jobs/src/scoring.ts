import type { CryptoMarketCategory } from "@orakly/crypto-integrations";
import {
  CRYPTO_SIGNAL_CATEGORIES,
  type NormalizedCryptoAsset,
} from "@orakly/crypto-integrations";

export type ScoredCryptoAsset = NormalizedCryptoAsset & {
  hotScore: number;
  volatilityScore: number;
  volumeScore: number;
  memeScore: number;
  primaryBucket: CryptoMarketCategory;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function computeScoresForBatch(
  assets: NormalizedCryptoAsset[],
): ScoredCryptoAsset[] {
  const maxVol = Math.max(
    1,
    ...assets.map((a) =>
      a.volume24hUsd != null && Number.isFinite(a.volume24hUsd)
        ? a.volume24hUsd
        : 0,
    ),
  );
  return assets.map((a) => scoreOne(a, maxVol));
}

function scoreOne(
  asset: NormalizedCryptoAsset,
  maxVol: number,
): ScoredCryptoAsset {
  const trending = asset.categoryScores.trending_all ?? 0;
  let maxCat = 0;
  for (const c of CRYPTO_SIGNAL_CATEGORIES) {
    maxCat = Math.max(maxCat, asset.categoryScores[c] ?? 0);
  }
  const base = 0.55 * trending + 0.45 * maxCat;

  const vol = asset.volume24hUsd ?? 0;
  const volumeScore = clamp(
    (Math.log10(vol + 1) / Math.log10(maxVol + 1)) * 100,
    0,
    100,
  );

  const ch = asset.change24hPct ?? 0;
  const volatilityScore = clamp(Math.abs(ch), 0, 100);

  const memeScore = asset.categoryScores.memecoin_pump ?? 0;

  const hotScore = clamp(
    0.34 * base +
      0.26 * volumeScore +
      0.26 * volatilityScore +
      0.14 * memeScore,
    0,
    100,
  );

  const primaryBucket = pickPrimaryBucket(asset.categoryScores, {
    volumeScore,
    volatilityScore,
    memeScore,
  });

  return {
    ...asset,
    hotScore,
    volatilityScore,
    volumeScore,
    memeScore,
    primaryBucket,
  };
}

function pickPrimaryBucket(
  scores: NormalizedCryptoAsset["categoryScores"],
  derived: { volumeScore: number; volatilityScore: number; memeScore: number },
): CryptoMarketCategory {
  if ((scores.memecoin_pump ?? 0) >= 28 || derived.memeScore >= 50) {
    return "memecoin_pump";
  }
  if (derived.volatilityScore >= 40 && (scores.top_gainers ?? 0) > 0) {
    return "top_gainers";
  }
  if (derived.volumeScore >= 52 && (scores.top_volume ?? 0) > 0) {
    return "top_volume";
  }
  if ((scores.new_listings ?? 0) >= 25) {
    return "new_listings";
  }
  return "trending_all";
}
