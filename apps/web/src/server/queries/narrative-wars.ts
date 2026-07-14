import { MarketStatus } from "@prisma/client";
import { prisma } from "@orakly/database";
import type { NarrativeWarCard } from "@/shared/contracts/hub-home";
import { NARRATIVE_WAR_PAIRS } from "@/widgets/dapp-hub/lib/narrative-war-pairs";
import { getAttentionDashboardRows } from "./attention-dashboard";

function splitProbs(scoreA: number, scoreB: number): { a: number; b: number } {
  const total = scoreA + scoreB;
  if (total <= 0) return { a: 50, b: 50 };
  return {
    a: Math.round((scoreA / total) * 100),
    b: Math.round((scoreB / total) * 100),
  };
}

function titleMatchesNarratives(title: string, a: string, b: string): boolean {
  const t = title.toLowerCase();
  return (
    (t.includes(a.toLowerCase()) && t.includes(b.toLowerCase())) ||
    (t.includes(a.toLowerCase()) && t.includes("vs")) ||
    (t.includes(b.toLowerCase()) && t.includes("vs"))
  );
}

export async function getNarrativeWars(): Promise<NarrativeWarCard[]> {
  const [attentionRows, markets] = await Promise.all([
    getAttentionDashboardRows(),
    prisma.market.findMany({
      where: { status: MarketStatus.OPEN },
      select: {
        slug: true,
        title: true,
        volume24hUsd: true,
        marketSuggestion: { select: { narrative: true } },
      },
    }),
  ]);

  const scoreMap = new Map(attentionRows.map((r) => [r.narrative, r]));
  const momentumMap = new Map(attentionRows.map((r) => [r.narrative, r.momentumPct]));

  return NARRATIVE_WAR_PAIRS.map((pair) => {
    const rowA = scoreMap.get(pair.narrativeA);
    const rowB = scoreMap.get(pair.narrativeB);
    const scoreA = rowA?.score ?? 50;
    const scoreB = rowB?.score ?? 50;
    const probs = splitProbs(scoreA, scoreB);

    const narratives = new Set<string>([pair.narrativeA, pair.narrativeB]);
    let totalVolume24hUsd = 0;
    for (const m of markets) {
      const narrative = m.marketSuggestion?.narrative;
      if (narrative && narratives.has(narrative)) {
        totalVolume24hUsd += Number(m.volume24hUsd);
      }
    }

    const headToHead =
      markets.find((m) => titleMatchesNarratives(m.title, pair.narrativeA, pair.narrativeB)) ??
      markets.find(
        (m) =>
          m.marketSuggestion?.narrative === pair.narrativeA ||
          m.marketSuggestion?.narrative === pair.narrativeB,
      );

    const momA = momentumMap.get(pair.narrativeA) ?? 0;
    const momB = momentumMap.get(pair.narrativeB) ?? 0;

    return {
      id: pair.id,
      label: pair.label,
      narrativeA: pair.narrativeA,
      narrativeB: pair.narrativeB,
      probAPct: probs.a,
      probBPct: probs.b,
      totalVolume24hUsd,
      conviction: Math.max(scoreA, scoreB),
      momentumPct: Math.abs(momA) >= Math.abs(momB) ? momA : momB,
      marketSlug: headToHead?.slug ?? null,
      marketTitle: headToHead?.title ?? null,
    };
  });
}
