import type { CryptoMarketCategory } from "@orakly/crypto-integrations";

export type SignalMarketSeed = {
  dedupeKey: string;
  symbol: string | null;
  name: string | null;
  primaryBucket: CryptoMarketCategory;
  hotScore: number;
  volatilityScore: number;
  volumeScore: number;
  memeScore: number;
  volume24hUsd: number | null;
  liquidityUsd: number | null;
  change24hPct: number | null;
  priceUsd: number | null;
};

export function slugFromDedupeKey(dedupeKey: string): string {
  const normalized = dedupeKey
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
  const base = normalized.length > 0 ? normalized : "token";
  return `crypto-${base}`;
}
