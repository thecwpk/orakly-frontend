import "server-only";

import { MarketStatus, MarketSuggestionStatus, Prisma } from "@prisma/client";
import { prisma } from "@orakly/database";

export type SuggestionStatusFilter = "pending" | "approved" | "rejected" | "all";
export type SuggestionSort = "votes" | "newest";

const STATUS_MAP: Record<Exclude<SuggestionStatusFilter, "all">, MarketSuggestionStatus> = {
  pending: MarketSuggestionStatus.PENDING,
  approved: MarketSuggestionStatus.APPROVED,
  rejected: MarketSuggestionStatus.REJECTED,
};

export type CommunitySuggestionDto = {
  id: string;
  question: string;
  title: string;
  description: string | null;
  category: string;
  narrative: string | null;
  status: string;
  voteCount: number;
  voterAddresses: string[];
  votesUp: number;
  votesDown: number;
  creatorAddress: string | null;
  creatorRewardPercent: number;
  feesEarned: number;
  rejectionReason: string | null;
  resolutionSource: string | null;
  submitterId: string | null;
  marketId: string | null;
  marketSlug: string | null;
  createdAt: string;
  updatedAt: string;
};

const suggestionSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  narrative: true,
  status: true,
  voteCount: true,
  voterAddresses: true,
  votesUp: true,
  votesDown: true,
  creatorRewardPercent: true,
  feesEarned: true,
  rejectionReason: true,
  triggerReason: true,
  submitterId: true,
  marketId: true,
  createdAt: true,
  updatedAt: true,
  submitter: {
    select: { walletAddress: true },
  },
  market: {
    select: { slug: true },
  },
} satisfies Prisma.MarketSuggestionSelect;

type SuggestionRow = Prisma.MarketSuggestionGetPayload<{ select: typeof suggestionSelect }>;

export function serializeSuggestion(row: SuggestionRow): CommunitySuggestionDto {
  return {
    id: row.id,
    question: row.title,
    title: row.title,
    description: row.description,
    category: row.category,
    narrative: row.narrative,
    status: row.status.toLowerCase(),
    voteCount: row.voteCount,
    voterAddresses: row.voterAddresses,
    votesUp: row.votesUp,
    votesDown: row.votesDown,
    creatorAddress: row.submitter?.walletAddress?.toLowerCase() ?? null,
    creatorRewardPercent: row.creatorRewardPercent,
    feesEarned: row.feesEarned,
    rejectionReason: row.rejectionReason,
    resolutionSource: row.triggerReason,
    submitterId: row.submitterId,
    marketId: row.marketId,
    marketSlug: row.market?.slug ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function parseStatusFilter(raw: string | null): SuggestionStatusFilter {
  if (raw === "approved" || raw === "rejected" || raw === "all") return raw;
  return "pending";
}

export function parseSort(raw: string | null): SuggestionSort {
  return raw === "newest" ? "newest" : "votes";
}

export async function listCommunitySuggestions(input: {
  status: SuggestionStatusFilter;
  sort: SuggestionSort;
  address?: string;
}): Promise<CommunitySuggestionDto[]> {
  const where: Prisma.MarketSuggestionWhereInput = {};

  if (input.status !== "all") {
    where.status =
      input.status === "pending"
        ? { in: [MarketSuggestionStatus.PENDING, MarketSuggestionStatus.IN_REVIEW] }
        : STATUS_MAP[input.status];
  }

  const address = input.address?.trim();
  if (address) {
    where.submitter = {
      walletAddress: { equals: address, mode: "insensitive" },
    };
  }

  const orderBy: Prisma.MarketSuggestionOrderByWithRelationInput[] =
    input.sort === "newest"
      ? [{ createdAt: "desc" }]
      : [{ voteCount: "desc" }, { createdAt: "desc" }];

  const rows = await prisma.marketSuggestion.findMany({
    where,
    orderBy,
    take: 100,
    select: suggestionSelect,
  });

  return rows.map(serializeSuggestion);
}

export async function ensureSubmitterWallet(userId: string, walletAddress: string) {
  await prisma.user.updateMany({
    where: { id: userId, walletAddress: null },
    data: { walletAddress: walletAddress.toLowerCase() },
  });
}

export async function createCommunitySuggestion(input: {
  userId: string;
  walletAddress: string;
  question: string;
  category: string;
  description?: string;
  resolutionSource?: string;
}) {
  await ensureSubmitterWallet(input.userId, input.walletAddress);

  const row = await prisma.marketSuggestion.create({
    data: {
      title: input.question.trim(),
      description: input.description?.trim() || null,
      category: input.category.trim(),
      narrative: input.category.trim(),
      submitterId: input.userId,
      status: MarketSuggestionStatus.PENDING,
      voteCount: 0,
      voterAddresses: [],
      triggerReason: input.resolutionSource?.trim() || "Community submission",
    },
    select: suggestionSelect,
  });

  return serializeSuggestion(row);
}

export async function toggleSuggestionVote(suggestionId: string, walletAddress: string) {
  const normalized = walletAddress.toLowerCase();

  return prisma.$transaction(async (tx) => {
    const suggestion = await tx.marketSuggestion.findUnique({
      where: { id: suggestionId },
      select: { id: true, voteCount: true, voterAddresses: true },
    });

    if (!suggestion) {
      throw new Error("SUGGESTION_NOT_FOUND");
    }

    const alreadyVoted = suggestion.voterAddresses.some(
      (addr) => addr.toLowerCase() === normalized,
    );

    if (alreadyVoted) {
      const nextAddresses = suggestion.voterAddresses.filter(
        (addr) => addr.toLowerCase() !== normalized,
      );
      const nextCount = Math.max(0, suggestion.voteCount - 1);

      await tx.marketSuggestion.update({
        where: { id: suggestionId },
        data: {
          voterAddresses: nextAddresses,
          voteCount: nextCount,
        },
      });

      return { voteCount: nextCount, hasVoted: false };
    }

    const nextCount = suggestion.voteCount + 1;
    await tx.marketSuggestion.update({
      where: { id: suggestionId },
      data: {
        voterAddresses: { push: normalized },
        voteCount: nextCount,
      },
    });

    return { voteCount: nextCount, hasVoted: true };
  });
}

export async function readDefaultCreatorRewardPercent(): Promise<number> {
  const row = await prisma.platformConfig.findUnique({
    where: { key: "creator_default_reward_percent" },
    select: { value: true },
  });
  const parsed = row ? Number.parseFloat(row.value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 5;
}

function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

async function uniqueMarketSlug(tx: Prisma.TransactionClient, base: string): Promise<string> {
  let slug = slugify(base);
  if (!slug) slug = `market-${Date.now()}`;
  let candidate = slug;
  let n = 0;
  while (await tx.market.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    n += 1;
    candidate = `${slug}-${n}`;
  }
  return candidate;
}

export async function approveCommunitySuggestion(
  suggestionId: string,
  creatorRewardPercent?: number,
) {
  const reward =
    creatorRewardPercent ?? (await readDefaultCreatorRewardPercent());

  return prisma.$transaction(async (tx) => {
    const suggestion = await tx.marketSuggestion.findUnique({
      where: { id: suggestionId },
      select: {
        ...suggestionSelect,
        status: true,
        marketId: true,
      },
    });

    if (!suggestion) {
      throw new Error("SUGGESTION_NOT_FOUND");
    }
    if (suggestion.status === MarketSuggestionStatus.APPROVED && suggestion.marketId) {
      const market = await tx.market.findUnique({ where: { id: suggestion.marketId } });
      if (market) return market;
    }
    if (suggestion.status === MarketSuggestionStatus.REJECTED) {
      throw new Error("SUGGESTION_REJECTED");
    }

    const category = await tx.category.findFirst({
      where: { slug: suggestion.category },
      select: { id: true },
    });

    const creatorAddress = suggestion.submitter?.walletAddress?.toLowerCase() ?? null;
    const slug = await uniqueMarketSlug(tx, suggestion.title);
    const closesAt = new Date(Date.now() + 90 * 86_400_000);
    const mid = new Prisma.Decimal("0.5");

    const market = await tx.market.create({
      data: {
        title: suggestion.title,
        slug,
        description: suggestion.description,
        categoryId: category?.id ?? null,
        creatorId: suggestion.submitterId,
        creatorAddress,
        creatorRewardPercent: reward,
        resolutionSource: suggestion.triggerReason,
        narrative: suggestion.narrative,
        status: MarketStatus.OPEN,
        opensAt: new Date(),
        closesAt,
        yesPrice: mid,
        noPrice: new Prisma.Decimal("0.5"),
        probability: mid,
        takerFeeBps: 25,
        makerFeeBps: 0,
        liquidityUsd: new Prisma.Decimal(25_000),
        collateralPoolUsd: new Prisma.Decimal(0),
      },
    });

    await tx.marketSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: MarketSuggestionStatus.APPROVED,
        marketId: market.id,
        creatorRewardPercent: reward,
      },
    });

    return market;
  });
}

export async function rejectCommunitySuggestion(suggestionId: string, reason?: string) {
  const existing = await prisma.marketSuggestion.findUnique({
    where: { id: suggestionId },
    select: { id: true },
  });
  if (!existing) {
    throw new Error("SUGGESTION_NOT_FOUND");
  }

  const row = await prisma.marketSuggestion.update({
    where: { id: suggestionId },
    data: {
      status: MarketSuggestionStatus.REJECTED,
      rejectionReason: reason?.trim() || null,
    },
    select: suggestionSelect,
  });

  return serializeSuggestion(row);
}
