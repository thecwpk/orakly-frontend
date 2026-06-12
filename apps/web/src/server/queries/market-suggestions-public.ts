import { MarketSuggestionStatus } from "@prisma/client";
import { prisma } from "@orakly/database";
import type { MarketSuggestionRow } from "@/shared/contracts/hub-home";

export async function getPublicMarketSuggestions(take = 5): Promise<MarketSuggestionRow[]> {
  const rows = await prisma.marketSuggestion.findMany({
    where: {
      status: { in: [MarketSuggestionStatus.PENDING, MarketSuggestionStatus.IN_REVIEW] },
    },
    orderBy: [{ votesUp: "desc" }, { createdAt: "desc" }],
    take,
    select: {
      id: true,
      title: true,
      votesUp: true,
      votesDown: true,
      narrative: true,
      status: true,
      createdAt: true,
    },
  });

  return rows.map((r) => {
    const creator = r.narrative ? `${r.narrative} signal` : "Community";
    return {
      id: r.id,
      title: r.title,
      votesUp: r.votesUp,
      votesDown: r.votesDown,
      narrative: r.narrative,
      status: r.status,
      creator,
      createdAt: r.createdAt.toISOString(),
    };
  });
}
