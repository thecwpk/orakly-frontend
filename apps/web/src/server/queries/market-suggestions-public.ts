import { MarketSuggestionStatus } from "@prisma/client";
import { prisma } from "@orakly/database";
import type { MarketSuggestionRow } from "@/shared/contracts/hub-home";

function formatCreator(
  submitter: { displayName: string | null; walletAddress: string | null } | null,
  narrative: string | null,
): string {
  if (submitter?.displayName?.trim()) return submitter.displayName.trim();
  if (submitter?.walletAddress) {
    const w = submitter.walletAddress;
    return `${w.slice(0, 6)}…${w.slice(-4)}`;
  }
  return narrative ? `${narrative} signal` : "Community";
}

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
      submitterId: true,
      submitter: {
        select: { displayName: true, walletAddress: true },
      },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    votesUp: r.votesUp,
    votesDown: r.votesDown,
    narrative: r.narrative,
    status: r.status,
    creator: formatCreator(r.submitter, r.narrative),
    creatorId: r.submitterId,
    createdAt: r.createdAt.toISOString(),
  }));
}
