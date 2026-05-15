import type { CryptoMarketCategory } from "./categories";
import type { CryptoDataProviderId } from "./providers";

/**
 * Provider-agnostic token/market snapshot after normalization.
 * Dedupe via `dedupeKey()` — prefers on-chain identity, then CoinGecko id.
 */
export type NormalizedCryptoAsset = {
  dedupeKey: string;
  chainId: string | null;
  tokenAddress: string | null;
  coingeckoId: string | null;
  symbol: string | null;
  name: string | null;
  priceUsd: number | null;
  liquidityUsd: number | null;
  volume24hUsd: number | null;
  fdvUsd: number | null;
  change24hPct: number | null;
  pairCreatedAtMs: number | null;
  imageUrl: string | null;
  pairAddress: string | null;
  dexId: string | null;
  providers: CryptoDataProviderId[];
  /** Higher = stronger signal for that leaderboard. */
  categoryScores: Partial<Record<CryptoMarketCategory, number>>;
  fetchedAt: string;
};
