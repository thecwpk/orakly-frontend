import { MarketStatus } from "@prisma/client";
import { prisma } from "@orakly/database";
import type { CategoryOverviewRow } from "@/shared/contracts/hub-home";
import { getAttentionDashboardRows } from "./attention-dashboard";

/** Spec homepage categories — slug → display name. */
export const HUB_CATEGORY_SLUGS: readonly { slug: string; name: string }[] = [
  { slug: "meme-coins", name: "Meme Coins" },
  { slug: "crypto-narratives", name: "Crypto Narratives" },
  { slug: "ecosystems", name: "Ecosystems" },
  { slug: "market-sentiment", name: "Market Sentiment" },
  { slug: "industry-events", name: "Industry Events" },
] as const;

const NARRATIVE_BY_CATEGORY: Record<string, string[]> = {
  "meme-coins": ["Memes"],
  "crypto-narratives": ["AI", "DeFi", "ETF"],
  ecosystems: ["Solana", "Base", "RWA"],
  "market-sentiment": ["Gaming", "DeFi"],
  "industry-events": ["ETF", "RWA"],
};

export async function getCategoriesOverview(): Promise<CategoryOverviewRow[]> {
  const [categories, attentionRows] = await Promise.all([
    prisma.category.findMany({
      where: { slug: { in: HUB_CATEGORY_SLUGS.map((c) => c.slug) } },
      include: {
        markets: {
          where: { status: MarketStatus.OPEN },
          select: { volumeTotalUsd: true },
        },
      },
    }),
    getAttentionDashboardRows(),
  ]);

  const catMap = new Map(categories.map((c) => [c.slug, c]));
  const topScore = (narratives: string[]): string | null => {
    let best: { n: string; s: number } | null = null;
    for (const row of attentionRows) {
      if (!narratives.includes(row.narrative)) continue;
      if (!best || row.score > best.s) best = { n: row.narrative, s: row.score };
    }
    return best?.n ?? null;
  };

  return HUB_CATEGORY_SLUGS.map((spec) => {
    const cat = catMap.get(spec.slug);
    const markets = cat?.markets ?? [];
    const marketCount = markets.length;
    const totalVolumeUsd = markets.reduce((s, m) => s + Number(m.volumeTotalUsd), 0);
  const narratives = NARRATIVE_BY_CATEGORY[spec.slug] ?? [];
    return {
      slug: spec.slug,
      name: cat?.name ?? spec.name,
      marketCount,
      totalVolumeUsd,
      topNarrative: topScore(narratives),
    };
  });
}
