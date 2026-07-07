import { prisma } from "@orakly/database";
import { MarketSuggestionStatus } from "@prisma/client";
import type { NarrativeScoreRow } from "./narrativeEngine.service.js";

const SUGGESTION_TEMPLATES: Record<
  string,
  { title: string; description: string; compare?: string }
> = {
  AI: {
    title: "Will AI outperform Meme coins in the next 30 days?",
    description:
      "AI narrative attention spiked — market on relative performance vs memecoins.",
    compare: "Memes",
  },
  Memes: {
    title: "Will Memecoins regain dominance over DeFi this month?",
    description: "Meme attention cycle heating up vs DeFi flows.",
    compare: "DeFi",
  },
  Solana: {
    title: "Will Solana ecosystem TVL grow faster than Base this quarter?",
    description: "Solana narrative momentum vs Base L2 attention.",
    compare: "Base",
  },
  Base: {
    title: "Will Base chain activity exceed Solana this month?",
    description: "Base L2 narrative surge vs Solana engagement.",
    compare: "Solana",
  },
  DeFi: {
    title: "Will DeFi total volume beat Gaming narratives in 30 days?",
    description: "DeFi capital rotation signal vs gaming attention.",
    compare: "Gaming",
  },
  Gaming: {
    title: "Will Gaming narratives outperform RWA this month?",
    description: "GameFi attention vs real-world asset narrative.",
    compare: "RWA",
  },
  RWA: {
    title: "Will RWA tokenization narratives lead DeFi growth?",
    description: "RWA institutional flow signal vs broader DeFi.",
    compare: "DeFi",
  },
  ETF: {
    title: "Will ETF flows dominate AI token performance this month?",
    description: "ETF macro narrative vs AI crypto beta.",
    compare: "AI",
  },
};

function scoreDeltaPct(current: number, previous: number | null): number {
  if (previous == null || previous <= 0) return 0;
  return ((current - previous) / previous) * 100;
}

export async function generateMarketSuggestions(input: {
  narratives: NarrativeScoreRow[];
  volumeSpikes: string[];
}): Promise<number> {
  let created = 0;

  for (const row of input.narratives) {
    const delta = scoreDeltaPct(row.score, row.previousScore);
    const volumeSpike = input.volumeSpikes.includes(row.narrative);

    if (delta <= 10 && !volumeSpike) continue;

    const template = SUGGESTION_TEMPLATES[row.narrative];
    if (!template) continue;

    const triggerReason = volumeSpike
      ? `Volume spike on ${row.narrative}`
      : `Score increased ${delta.toFixed(1)}%`;

    const existing = await prisma.marketSuggestion.findFirst({
      where: {
        narrative: row.narrative,
        status: MarketSuggestionStatus.PENDING,
        title: template.title,
      },
    });

    if (existing) continue;

    await prisma.marketSuggestion.create({
      data: {
        title: template.title,
        description: template.description,
        category: row.narrative,
        narrative: row.narrative,
        votesUp: 0,
        votesDown: 0,
        status: MarketSuggestionStatus.PENDING,
        triggerReason,
      },
    });

    created += 1;
  }

  return created;
}
