/**
 * Market Pulse — typed view model + demo fallback.
 *
 * Swap `resolveMarketPulseStats` / `MARKET_PULSE_DEMO_STATS` for a live-only path
 * once production always has non-zero homeStats. UI must never render blank / N/A.
 */
import type { HomeStatsPayload, MarketSentiment } from "@/shared/contracts/hub-home";

export type MarketPulseStats = {
  attentionIndex: number;
  /** Qualitative tag derived only from Attention Index. */
  attentionTag: MarketSentiment;
  /** Distinct desk read — derived from volume / traders / OI, not Attention Index alone. */
  marketSentiment: MarketSentiment;
  currentMeta: string;
  topChain: string;
  liveMarkets: number;
  volume24hUsd: number;
  openInterest: number;
  activeTraders: number;
  /** `api` when homeStats looked populated; `demo` when fallback filled gaps. */
  source: "api" | "demo";
};

/**
 * Clearly-typed demo desk — used only when the API is empty / failed.
 * Keep numbers internally consistent so Live Markets matches this mock set.
 */
export const MARKET_PULSE_DEMO_STATS: Readonly<Omit<MarketPulseStats, "source" | "attentionTag" | "marketSentiment">> & {
  sentiment: MarketSentiment;
} = {
  attentionIndex: 64,
  sentiment: "Neutral",
  currentMeta: "AI Infrastructure",
  topChain: "BNB",
  /** ~one narrative lane's worth of live books on a busy desk. */
  liveMarkets: 24,
  /** ~$400k–$900k per market — busy but not casino-scale. */
  volume24hUsd: 14_800_000,
  /** Roughly 45–55% of 24h volume still open. */
  openInterest: 7_200_000,
  /**
   * ~600 traders / $14.8M ≈ $25k notional per active trader —
   * proportional to volume without looking empty next to it.
   */
  activeTraders: 612,
};

export function attentionTagFromIndex(index: number): MarketSentiment {
  if (index >= 70) return "Bullish";
  if (index >= 40) return "Neutral";
  return "Bearish";
}

/**
 * Market Sentiment is intentionally independent of Attention Index:
 * desk heat from volume, traders, and open interest.
 */
export function marketSentimentFromDesk(input: {
  volume24hUsd: number;
  openInterest: number;
  activeTraders: number;
  liveMarkets: number;
}): MarketSentiment {
  const { volume24hUsd, openInterest, activeTraders, liveMarkets } = input;
  const volPerMarket = liveMarkets > 0 ? volume24hUsd / liveMarkets : 0;
  const traderDensity = liveMarkets > 0 ? activeTraders / liveMarkets : 0;
  const oiCover = openInterest > 0 ? volume24hUsd / openInterest : 0;

  if (volume24hUsd >= 5_000_000 && traderDensity >= 20 && oiCover >= 0.5) {
    return "Bullish";
  }
  if (volume24hUsd < 250_000 || (liveMarkets > 0 && traderDensity < 3)) {
    return "Bearish";
  }
  if (volPerMarket >= 200_000 && oiCover >= 0.25) {
    return "Bullish";
  }
  return "Neutral";
}

export function isHomeStatsSparse(stats: HomeStatsPayload | null | undefined): boolean {
  if (!stats) return true;
  return (
    stats.attentionIndex <= 0 &&
    stats.liveMarkets <= 0 &&
    stats.volume24hUsd <= 0 &&
    stats.activeTraders <= 0
  );
}

/**
 * Catch desks where volume/markets imply activity but trader count is near-empty
 * (typical under-seeded trade tables). Prefer coherent demo over absurd ratios.
 */
export function isHomeStatsIncoherent(
  stats: HomeStatsPayload | null | undefined,
): boolean {
  if (!stats || isHomeStatsSparse(stats)) return true;
  const { volume24hUsd, activeTraders, liveMarkets } = stats;
  if (volume24hUsd >= 1_000_000 && activeTraders < 15) return true;
  if (liveMarkets >= 40 && activeTraders < 10) return true;
  if (volume24hUsd >= 50_000_000 && activeTraders < 80) return true;
  return false;
}

export function resolveMarketPulseStats(
  api: HomeStatsPayload | null | undefined,
  opts?: { apiError?: boolean },
): MarketPulseStats {
  if (opts?.apiError || isHomeStatsIncoherent(api)) {
    const d = MARKET_PULSE_DEMO_STATS;
    return {
      attentionIndex: d.attentionIndex,
      attentionTag: attentionTagFromIndex(d.attentionIndex),
      marketSentiment: marketSentimentFromDesk(d),
      currentMeta: d.currentMeta,
      topChain: d.topChain,
      liveMarkets: d.liveMarkets,
      volume24hUsd: d.volume24hUsd,
      openInterest: d.openInterest,
      activeTraders: d.activeTraders,
      source: "demo",
    };
  }

  const attentionIndex = Math.round(
    Math.min(100, Math.max(0, Number(api!.attentionIndex) || 0)),
  );
  const liveMarkets = Math.max(0, Math.floor(Number(api!.liveMarkets) || 0));
  const volume24hUsd = Math.max(0, Number(api!.volume24hUsd) || 0);
  const openInterest = Math.max(0, Number(api!.openInterest) || 0);
  const activeTraders = Math.max(0, Math.floor(Number(api!.activeTraders) || 0));
  const currentMeta =
    api!.currentMeta?.trim() && api!.currentMeta.trim() !== "N/A"
      ? api!.currentMeta.trim()
      : "Crypto";
  const topChain = api!.topChain?.trim() || "BNB";

  return {
    attentionIndex,
    attentionTag: attentionTagFromIndex(attentionIndex),
    marketSentiment: marketSentimentFromDesk({
      volume24hUsd,
      openInterest,
      activeTraders,
      liveMarkets,
    }),
    currentMeta,
    topChain,
    liveMarkets,
    volume24hUsd,
    openInterest,
    activeTraders,
    source: "api",
  };
}
