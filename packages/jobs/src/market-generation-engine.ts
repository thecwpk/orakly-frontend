import { Prisma } from "@prisma/client";
import { slugFromDedupeKey, type SignalMarketSeed } from "./market-factory";
import {
  buildDynamicMarketCopy,
  type MarketTitleTemplate,
} from "./title-engine";

const ENGINE_VERSION = 1;

export type AutoMarketDraft = {
  slugBase: string;
  title: string;
  description: string;
  categorySlug: string;
  opensAt: Date;
  closesAt: Date;
  yesPrice: Prisma.Decimal;
  noPrice: Prisma.Decimal;
  /** Seeded pool depth for AMM / orderbook bootstrap (denormalized). */
  liquidityUsd: Prisma.Decimal;
  volume24hUsd: Prisma.Decimal;
  trendingScore: Prisma.Decimal;
  generationKey: string;
  generationMeta: Prisma.InputJsonValue;
  templateId: MarketTitleTemplate;
};

function envNum(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function canonicalSymbol(seed: SignalMarketSeed): string {
  const raw = (seed.symbol ?? seed.name ?? "UNK").replace(/[^a-zA-Z0-9]/g, "");
  return raw.slice(0, 24).toUpperCase() || "UNK";
}

/**
 * Cross-signal duplicate prevention: same template + symbol + horizon + target band.
 */
export function buildGenerationKey(
  templateId: MarketTitleTemplate,
  seed: SignalMarketSeed,
  horizonHours: number,
  targetMovePct: number | null,
): string {
  const sym = canonicalSymbol(seed);
  const tgt =
    targetMovePct != null ? `${Math.round(targetMovePct)}` : "vol";
  return `auto:v${ENGINE_VERSION}:${templateId}:${sym}:${horizonHours}h:${tgt}`.slice(
    0,
    310,
  );
}

/** Hot rank blend for sorting feeds — favors liquidity-heavy viral names. */
export function computeTrendingRankScore(seed: SignalMarketSeed): number {
  const hot = seed.hotScore;
  const volBoost = Math.min(18, seed.volumeScore / 6);
  const memeBoost = seed.memeScore >= 35 ? 8 : 0;
  return clamp(hot * 1.12 + volBoost + memeBoost, 0, 999);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function computeInitialLiquidityUsd(seed: SignalMarketSeed): Prisma.Decimal {
  const base = envNum("AUTO_MARKET_LIQUIDITY_BASE_USD", 2_500);
  const bonusCap = envNum("AUTO_MARKET_LIQUIDITY_BONUS_MAX_USD", 7_500);
  const bonus = (seed.hotScore / 100) * bonusCap;
  const memeExtra =
    seed.primaryBucket === "memecoin_pump" ? envNum("AUTO_MARKET_MEME_LIQUIDITY_EXTRA_USD", 1_000) : 0;
  const total = base + bonus + memeExtra;
  return new Prisma.Decimal(total.toFixed(2));
}

export function generateAutoMarketDraft(
  seed: SignalMarketSeed,
  categorySlug: string,
  now: Date,
): AutoMarketDraft {
  const copy = buildDynamicMarketCopy(seed);
  const closesAt = new Date(
    now.getTime() + copy.horizonHours * 3_600_000,
  );

  const generationKey = buildGenerationKey(
    copy.templateId,
    seed,
    copy.horizonHours,
    copy.targetMovePct,
  );

  const generationMeta: Prisma.InputJsonValue = {
    engineVersion: ENGINE_VERSION,
    templateId: copy.templateId,
    horizonHours: copy.horizonHours,
    targetMovePct: copy.targetMovePct,
    observedChange24hPct: seed.change24hPct,
    primaryBucket: seed.primaryBucket,
    categorySlug,
    lifecycle: {
      phase: "DRAFT_AUTO",
      next: ["ADMIN_REVIEW", "OPEN", "CLOSED", "RESOLVED"],
    },
  };

  const trendingScore = computeTrendingRankScore(seed);
  const liquidityUsd = computeInitialLiquidityUsd(seed);

  return {
    slugBase: slugFromDedupeKey(seed.dedupeKey),
    title: copy.title,
    description: copy.description,
    categorySlug,
    opensAt: now,
    closesAt,
    yesPrice: new Prisma.Decimal("0.5"),
    noPrice: new Prisma.Decimal("0.5"),
    liquidityUsd,
    volume24hUsd: new Prisma.Decimal(
      (seed.volume24hUsd ?? 0).toFixed(2),
    ),
    trendingScore: new Prisma.Decimal(trendingScore.toFixed(6)),
    generationKey,
    generationMeta,
    templateId: copy.templateId,
  };
}
