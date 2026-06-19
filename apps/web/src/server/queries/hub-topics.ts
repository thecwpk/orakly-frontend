import { MarketStatus } from "@prisma/client";
import { prisma } from "@orakly/database";
import type { HubTopicChip } from "@/shared/contracts/hub-home";
import { getAttentionDashboardRows } from "./attention-dashboard";
import { marketMatchesNarrative, NARRATIVE_CATEGORY_SLUGS } from "./hub-narrative-match";

const NARRATIVE_LABELS: Record<string, string> = {
  AI: "AI",
  Memes: "Meme Coins",
  Solana: "Solana",
  Base: "Base",
  RWA: "RWA",
  Gaming: "Gaming",
  DeFi: "DeFi",
  ETF: "ETF",
};

const MIN_SCORE_FOR_CHIP = 35;
const MAX_NARRATIVE_CHIPS = 6;

function narrativeLabel(key: string): string {
  return NARRATIVE_LABELS[key] ?? key;
}

/** Dynamic hub topic chips — narrative engine scores + breaking signal scan. */
export async function getHubTopicChips(): Promise<HubTopicChip[]> {
  const [attentionRows, openMarkets, breakingCount] = await Promise.all([
    getAttentionDashboardRows(),
    prisma.market.findMany({
      where: { status: MarketStatus.OPEN },
      select: {
        title: true,
        category: { select: { slug: true } },
        marketSuggestion: { select: { narrative: true } },
      },
    }),
    prisma.market.count({
      where: {
        status: MarketStatus.OPEN,
        cryptoSignalId: { not: null },
        signalLastSeenAt: { not: null },
      },
    }),
  ]);

  const marketCountByNarrative = new Map<string, number>();
  const narrativeKeys = new Set([
    ...attentionRows.map((r) => r.narrative),
    ...Object.keys(NARRATIVE_CATEGORY_SLUGS),
  ]);
  for (const n of narrativeKeys) {
    const count = openMarkets.filter((m) => marketMatchesNarrative(m, n)).length;
    if (count > 0) marketCountByNarrative.set(n, count);
  }

  const chips: HubTopicChip[] = [];

  if (breakingCount > 0) {
    chips.push({
      id: "breaking",
      kind: "breaking",
      label: "Breaking",
      marketCount: breakingCount,
    });
  }

  const narrativeChips = attentionRows
    .filter((row) => {
      const count = marketCountByNarrative.get(row.narrative) ?? 0;
      if (count > 0) return true;
      return row.trend === "RISING" && row.score >= MIN_SCORE_FOR_CHIP;
    })
    .sort((a, b) => {
      const aRising = a.trend === "RISING" ? 1 : 0;
      const bRising = b.trend === "RISING" ? 1 : 0;
      if (bRising !== aRising) return bRising - aRising;
      return b.score - a.score;
    })
    .slice(0, MAX_NARRATIVE_CHIPS)
    .map((row) => ({
      id: `narrative:${row.narrative}`,
      kind: "narrative" as const,
      slug: row.narrative,
      label: narrativeLabel(row.narrative),
      score: row.score,
      trend: row.trend,
      marketCount: marketCountByNarrative.get(row.narrative) ?? 0,
    }));

  chips.push(...narrativeChips);

  return chips;
}
