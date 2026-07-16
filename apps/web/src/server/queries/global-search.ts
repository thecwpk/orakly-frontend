import "server-only";

import { MarketStatus } from "@prisma/client";
import { prisma } from "@orakly/database";
import {
  buildCreatorFeesMap,
  resolveCreatorRank,
} from "@/server/queries/leaderboard.service";

export type SearchMarketHit = {
  id: string;
  slug: string;
  question: string;
  category: string | null;
  probability: number;
  volume: number;
};

export type SearchNarrativeHit = {
  slug: string;
  name: string;
  attentionScore: number;
  momentum: string;
};

export type SearchCreatorHit = {
  address: string;
  approvedMarkets: number;
  creatorRank: number | null;
};

export type SearchWalletHit = {
  address: string;
  winRatePct: number;
};

export type GlobalSearchResult = {
  markets: SearchMarketHit[];
  narratives: SearchNarrativeHit[];
  creators: SearchCreatorHit[];
  wallets: SearchWalletHit[];
};

export type SearchTypes = "markets" | "narratives" | "creators" | "wallets";

function looksLikeWalletQuery(q: string): boolean {
  return q.startsWith("0x") && q.length >= 10;
}

function toProb(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0.5;
  return n > 1 ? Math.min(1, n / 100) : Math.max(0, Math.min(1, n));
}

export async function runGlobalSearch(input: {
  q: string;
  types: Set<SearchTypes>;
}): Promise<GlobalSearchResult> {
  const q = input.q.trim();
  const empty: GlobalSearchResult = {
    markets: [],
    narratives: [],
    creators: [],
    wallets: [],
  };
  if (!q) return empty;

  const wantMarkets = input.types.has("markets");
  const wantNarratives = input.types.has("narratives");
  const wantCreators = input.types.has("creators");
  // Partial hex or full address — avoid matching every wallet on 1–2 char typing.
  const wantWallets =
    input.types.has("wallets") &&
    (looksLikeWalletQuery(q) || (q.length >= 4 && /[0-9a-fx]/i.test(q)));

  const [markets, narratives, creators, wallets] = await Promise.all([
    wantMarkets ? searchMarkets(q) : Promise.resolve([]),
    wantNarratives ? searchNarratives(q) : Promise.resolve([]),
    wantCreators ? searchCreators(q) : Promise.resolve([]),
    wantWallets ? searchWallets(q) : Promise.resolve([]),
  ]);

  return { markets, narratives, creators, wallets };
}

async function searchMarkets(q: string): Promise<SearchMarketHit[]> {
  const rows = await prisma.market.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ],
      status: { in: [MarketStatus.OPEN, MarketStatus.RESOLVED] },
    },
    orderBy: [{ volumeTotalUsd: "desc" }, { trendingScore: "desc" }],
    take: 4,
    select: {
      id: true,
      slug: true,
      title: true,
      probability: true,
      yesPrice: true,
      volumeTotalUsd: true,
      category: { select: { name: true, slug: true } },
      narrative: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    question: row.title,
    category: row.category?.name ?? row.narrative ?? null,
    probability: toProb(row.probability ?? row.yesPrice),
    volume: Number(row.volumeTotalUsd),
  }));
}

async function searchNarratives(q: string): Promise<SearchNarrativeHit[]> {
  const rows = await prisma.attentionScore.findMany({
    where: {
      OR: [
        { narrativeName: { contains: q, mode: "insensitive" } },
        { narrative: { contains: q, mode: "insensitive" } },
        { narrativeSlug: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { score: "desc" },
    take: 3,
    select: {
      narrativeSlug: true,
      narrative: true,
      narrativeName: true,
      score: true,
      momentum: true,
    },
  });

  return rows.map((row) => {
    const slug =
      row.narrativeSlug?.trim() ||
      row.narrative.trim().toLowerCase().replace(/\s+/g, "-");
    return {
      slug,
      name: row.narrativeName?.trim() || row.narrative,
      attentionScore: Number(row.score),
      momentum: row.momentum || "Stable",
    };
  });
}

async function searchCreators(q: string): Promise<SearchCreatorHit[]> {
  const rows = await prisma.market.findMany({
    where: {
      creatorAddress: { contains: q, mode: "insensitive" },
      status: { in: [MarketStatus.OPEN, MarketStatus.RESOLVED] },
    },
    select: { creatorAddress: true },
    take: 80,
  });

  const counts = new Map<string, number>();
  for (const row of rows) {
    const addr = row.creatorAddress?.toLowerCase();
    if (!addr) continue;
    counts.set(addr, (counts.get(addr) ?? 0) + 1);
  }

  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (top.length === 0) return [];

  const feesMap = await buildCreatorFeesMap();

  return top.map(([address, approvedMarkets]) => ({
    address,
    approvedMarkets,
    creatorRank: resolveCreatorRank(address, feesMap),
  }));
}

/**
 * Wallet search — schema has no `Trade.walletAddress`; resolve via
 * `User.walletAddress` for traders who appear on fills.
 */
async function searchWallets(q: string): Promise<SearchWalletHit[]> {
  const users = await prisma.user.findMany({
    where: {
      walletAddress: { contains: q, mode: "insensitive" },
      OR: [
        { tradesAsBuyer: { some: {} } },
        { tradesAsSeller: { some: {} } },
        { tradesAsTaker: { some: {} } },
      ],
    },
    take: 3,
    select: {
      id: true,
      walletAddress: true,
      tradesAsTaker: {
        take: 80,
        orderBy: { executedAt: "desc" },
        select: {
          outcome: true,
          market: {
            select: {
              status: true,
              resolvedOutcome: true,
            },
          },
        },
      },
    },
  });

  return users
    .filter((u) => Boolean(u.walletAddress))
    .map((u) => {
      const resolved = u.tradesAsTaker.filter(
        (t) => t.market.status === MarketStatus.RESOLVED && t.market.resolvedOutcome,
      );
      const wins = resolved.filter(
        (t) => t.outcome === t.market.resolvedOutcome,
      ).length;
      const winRatePct =
        resolved.length > 0 ? Math.round((wins / resolved.length) * 1000) / 10 : 0;

      return {
        address: u.walletAddress!.toLowerCase(),
        winRatePct,
      };
    });
}
