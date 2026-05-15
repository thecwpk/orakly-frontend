import type { CryptoMarketCategory } from "@orakly/crypto-integrations";
import type { SignalMarketSeed } from "./market-factory";

/** Template discriminator — stable for `generationKey` + metadata. */
export type MarketTitleTemplate =
  | "MOMENTUM_UP"
  | "MOMENTUM_DOWN"
  | "VOLUME_SURGE"
  | "MEME_HEAT"
  | "NEUTRAL_RANGE";

export type TitleEngineResult = {
  templateId: MarketTitleTemplate;
  title: string;
  description: string;
  horizonHours: number;
  /** YES outcome interpretation: e.g. additional % move. */
  targetMovePct: number | null;
};

const MOMENTUM_THRESHOLD = 12;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Maps observed 24h move → “another X%” headline number (5–35, stepped by 5). */
export function computeExtensionTargetPct(change24hPct: number | null): number {
  if (change24hPct == null || !Number.isFinite(change24hPct)) return 15;
  const mag = Math.abs(change24hPct);
  const raw = clamp(mag * 0.5, 5, 35);
  const stepped = Math.round(raw / 5) * 5;
  return clamp(stepped, 5, 35);
}

function displayLabel(seed: SignalMarketSeed): string {
  const s = seed.symbol?.trim();
  if (s && s.length > 0) return s.toUpperCase();
  const n = seed.name?.trim();
  if (n && n.length > 0) return n.slice(0, 48);
  return "This asset";
}

function formatVolUsd(v: number): string {
  return `$${Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(v)}`;
}

export function selectTitleTemplate(seed: SignalMarketSeed): MarketTitleTemplate {
  const ch = seed.change24hPct;
  const meme =
    seed.primaryBucket === "memecoin_pump" || seed.memeScore >= 38;

  if (meme && ch != null && ch >= MOMENTUM_THRESHOLD) return "MEME_HEAT";
  if (ch != null && ch >= MOMENTUM_THRESHOLD) return "MOMENTUM_UP";
  if (ch != null && ch <= -MOMENTUM_THRESHOLD) return "MOMENTUM_DOWN";
  if (
    seed.volumeScore >= 52 ||
    seed.primaryBucket === "top_volume"
  ) {
    return "VOLUME_SURGE";
  }
  return "NEUTRAL_RANGE";
}

function horizonFor(template: MarketTitleTemplate): number {
  switch (template) {
    case "VOLUME_SURGE":
      return 48;
    default:
      return 24;
  }
}

/**
 * Natural-language style titles (rules-based, no LLM). Keeps copy deterministic for oracle alignment.
 */
export function buildDynamicMarketCopy(seed: SignalMarketSeed): TitleEngineResult {
  const label = displayLabel(seed);
  const templateId = selectTitleTemplate(seed);
  const horizonHours = horizonFor(templateId);
  const targetMovePct = computeExtensionTargetPct(seed.change24hPct);

  const move =
    seed.change24hPct != null && Number.isFinite(seed.change24hPct)
      ? `${seed.change24hPct >= 0 ? "+" : ""}${seed.change24hPct.toFixed(1)}%`
      : "unknown";

  let title: string;
  let description: string;

  switch (templateId) {
    case "MOMENTUM_UP":
    case "MEME_HEAT":
      title = `Will ${label} rise another ${targetMovePct}% within ${horizonHours} hours?`;
      description = [
        `${label} is printing ~${move} over the last 24h.`,
        `YES resolves if spot references show at least +${targetMovePct}% from the oracle baseline captured at market open (see resolution policy).`,
        `Bucket: ${seed.primaryBucket} · Hot ${seed.hotScore.toFixed(1)}.`,
      ].join("\n");
      break;
    case "MOMENTUM_DOWN":
      title = `Will ${label} bounce at least ${targetMovePct}% within ${horizonHours} hours?`;
      description = [
        `${label} is down ~${move} over the last 24h.`,
        `YES resolves if recovery from the open baseline reaches +${targetMovePct}% before expiry.`,
        `Volatility score ${seed.volatilityScore.toFixed(1)}.`,
      ].join("\n");
      break;
    case "VOLUME_SURGE": {
      const v = seed.volume24hUsd;
      const floor =
        v != null && v > 0
          ? formatVolUsd(v * 1.08)
          : "the prior 24h pace";
      title = `Will ${label} post more than ${floor} in 24h volume before expiry?`;
      description = [
        `Liquidity is clustering around ${label} (volume score ${seed.volumeScore.toFixed(1)}).`,
        `YES if rolling 24h notional crosses the threshold stated in the title before ${horizonHours}h close.`,
        `Recent move ${move}.`,
      ].join("\n");
      break;
    }
    default:
      title = `Will ${label} close higher than its open reference within ${horizonHours} hours?`;
      description = [
        `Neutral momentum template — 24h move ~${move}.`,
        `YES if benchmark price finishes above the oracle baseline at window open.`,
        `Trending rank ${seed.hotScore.toFixed(1)}.`,
      ].join("\n");
  }

  return {
    templateId,
    title: title.slice(0, 500),
    description: description.slice(0, 8000),
    horizonHours,
    targetMovePct: templateId === "VOLUME_SURGE" ? null : targetMovePct,
  };
}

export function primaryBucketLabel(bucket: CryptoMarketCategory): string {
  switch (bucket) {
    case "memecoin_pump":
      return "Meme / pump attention";
    case "top_gainers":
      return "Top gainers";
    case "top_volume":
      return "Volume leaders";
    case "new_listings":
      return "New listings";
    default:
      return "Broad crypto trending";
  }
}
