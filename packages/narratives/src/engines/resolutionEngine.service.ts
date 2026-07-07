import { prisma } from "@orakly/database";
import {
  MarketStatus,
  OutcomeSide,
  ResolutionStatus,
} from "@prisma/client";
import { getAllCoingeckoNarratives } from "../externalApis/coingecko.service.js";
import { getNews } from "../externalApis/cryptopanic.service.js";
import { getAllDefiLlamaNarratives } from "../externalApis/defillama.service.js";
import { getCryptoPosts } from "../externalApis/reddit.service.js";
import { eventBus, SystemEvents } from "../events/eventBus.service.js";
import { withMarketLock } from "../infra/lock.service.js";
import { enqueueMarketPayout } from "../workers/payout.queue.js";

export type EvidenceSignal = {
  narrative: string;
  signalStrength: number;
  source: string;
};

export type ResolutionDecision = {
  marketId: string;
  narrative: string;
  forScore: number;
  againstScore: number;
  winner: "FOR" | "AGAINST" | null;
  status: "RESOLVED" | "PENDING_REVIEW";
  verification: {
    coingecko: boolean;
    news: boolean;
    reddit: boolean;
    agreeCount: number;
  };
  degraded: boolean;
};

function extractNarrative(market: {
  title: string;
  category?: { name: string; slug: string } | null;
  generationMeta: unknown;
}): string {
  const meta = market.generationMeta as { narrative?: string } | null;
  if (meta?.narrative) return meta.narrative;
  if (market.category?.name) return market.category.name;
  const hit = market.title.match(
    /\b(AI|Memes|Solana|Base|RWA|Gaming|DeFi|ETF)\b/i,
  );
  return hit?.[1] ?? "DeFi";
}

async function fetchEvidenceSafe(narrative: string): Promise<{
  signals: EvidenceSignal[];
  degraded: boolean;
}> {
  const results = await Promise.allSettled([
    getAllCoingeckoNarratives(),
    getNews(),
    getCryptoPosts(),
    getAllDefiLlamaNarratives(),
  ]);

  const signals: EvidenceSignal[] = [];
  let degraded = false;

  const [cgR, newsR, redditR, defiR] = results;

  if (cgR.status === "fulfilled") {
    const row = cgR.value.find((r) => r.narrative === narrative);
    signals.push({
      narrative,
      signalStrength: row?.momentum ?? 0,
      source: "coingecko",
    });
  } else degraded = true;

  if (newsR.status === "fulfilled") {
    const row = newsR.value.find((r) => r.narrative === narrative);
    signals.push({
      narrative,
      signalStrength: row?.mentionScore ?? 0,
      source: "cryptopanic",
    });
  } else degraded = true;

  if (redditR.status === "fulfilled") {
    const row = redditR.value.find((r) => r.narrative === narrative);
    signals.push({
      narrative,
      signalStrength: row?.engagementScore ?? 0,
      source: "reddit",
    });
  } else degraded = true;

  if (defiR.status === "fulfilled") {
    const row = defiR.value.find((r) => r.narrative === narrative);
    signals.push({
      narrative,
      signalStrength: Math.abs(row?.tvlGrowthPercent ?? 0),
      source: "defillama",
    });
  } else degraded = true;

  if (signals.length === 0) {
    const attention = await prisma.attentionScore.findUnique({
      where: { narrative },
    });
    if (attention) {
      signals.push({
        narrative,
        signalStrength: Number(attention.score),
        source: "db_snapshot",
      });
      degraded = true;
    } else {
      signals.push({
        narrative,
        signalStrength: 50,
        source: "fallback",
      });
      degraded = true;
    }
  }

  return { signals, degraded };
}

function scoreFromSignals(signals: EvidenceSignal[], invert = false): number {
  const pick = (source: string) =>
    signals.find((s) => s.source === source)?.signalStrength ?? 0;

  const coingecko = pick("coingecko");
  const news = pick("cryptopanic");
  const reddit = pick("reddit");
  const defi = pick("defillama");

  const raw = coingecko * 0.35 + news * 0.3 + reddit * 0.2 + defi * 0.15;
  return invert ? Math.max(0, 100 - raw) : raw;
}

function sourceConfirmsFor(
  signals: EvidenceSignal[],
  source: string,
  forWins: boolean,
): boolean {
  const row = signals.find((s) => s.source === source);
  if (!row) return false;
  return forWins ? row.signalStrength >= 50 : row.signalStrength < 50;
}

export async function evaluateMarketResolution(
  marketId: string,
): Promise<ResolutionDecision | null> {
  return withMarketLock(marketId, () => evaluateMarketResolutionInner(marketId));
}

async function evaluateMarketResolutionInner(
  marketId: string,
): Promise<ResolutionDecision> {
  const market = await prisma.market.findUnique({
    where: { id: marketId },
    include: { category: true },
  });

  if (!market) {
    throw new Error(`Market not found: ${marketId}`);
  }

  const narrative = extractNarrative(market);
  const { signals, degraded } = await fetchEvidenceSafe(narrative);

  const forScore = scoreFromSignals(signals, false);
  const againstScore = scoreFromSignals(signals, true);
  const forWins = forScore > againstScore;

  const cg = sourceConfirmsFor(signals, "coingecko", forWins);
  const news = sourceConfirmsFor(signals, "cryptopanic", forWins);
  const reddit = sourceConfirmsFor(signals, "reddit", forWins);
  const agreeCount = [cg, news, reddit].filter(Boolean).length;

  if (agreeCount < 2) {
    await prisma.market.update({
      where: { id: marketId },
      data: {
        resolutionStatus: ResolutionStatus.PENDING_REVIEW,
        resolutionReason: `Insufficient source agreement (${agreeCount}/3)`,
      },
    });

    return {
      marketId,
      narrative,
      forScore,
      againstScore,
      winner: null,
      status: "PENDING_REVIEW",
      verification: { coingecko: cg, news, reddit, agreeCount },
      degraded,
    };
  }

  const winner: "FOR" | "AGAINST" = forWins ? "FOR" : "AGAINST";
  const resolvedOutcome =
    winner === "FOR" ? OutcomeSide.YES : OutcomeSide.NO;

  await prisma.market.update({
    where: { id: marketId },
    data: {
      status: MarketStatus.RESOLVED,
      resolvedOutcome,
      resolvedAt: new Date(),
      resolutionStatus: ResolutionStatus.FINALIZED,
      resolutionReason: `Auto-resolved: FOR=${forScore.toFixed(2)} AGAINST=${againstScore.toFixed(2)}`,
      generationMeta: {
        ...(typeof market.generationMeta === "object" && market.generationMeta
          ? market.generationMeta
          : {}),
        resolution: { forScore, againstScore, signals, degraded },
        payoutPending: true,
      },
    },
  });

  await eventBus.emit(SystemEvents.MARKET_RESOLVED, {
    marketId,
    resolvedOutcome,
    status: "RESOLVED",
  });
  await enqueueMarketPayout(marketId);

  return {
    marketId,
    narrative,
    forScore,
    againstScore,
    winner,
    status: "RESOLVED",
    verification: { coingecko: cg, news, reddit, agreeCount },
    degraded,
  };
}

export async function runResolutionCycle(): Promise<{
  scanned: number;
  resolved: number;
  pendingReview: number;
}> {
  const now = new Date();
  const markets = await prisma.market.findMany({
    where: {
      status: { in: [MarketStatus.OPEN, MarketStatus.CLOSED] },
      resolvedAt: null,
      OR: [{ closesAt: { lte: now } }, { status: MarketStatus.CLOSED }],
    },
    select: { id: true, closesAt: true, status: true },
    take: 200,
  });

  let resolved = 0;
  let pendingReview = 0;

  for (const m of markets) {
    const decision = await evaluateMarketResolution(m.id);
    if (!decision) {
      console.info("[resolution] skipped — lock held", m.id);
      continue;
    }
    if (decision.status === "RESOLVED") resolved += 1;
    else pendingReview += 1;
  }

  return { scanned: markets.length, resolved, pendingReview };
}
