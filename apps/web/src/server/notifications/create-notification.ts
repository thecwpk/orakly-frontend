import "server-only";

import { ActivityType, type Prisma } from "@prisma/client";
import { prisma } from "@orakly/database";

export const VOTE_MILESTONES = [10, 25, 50] as const;

type DbClient = Prisma.TransactionClient | typeof prisma;

async function resolveUserId(
  db: DbClient,
  walletAddress: string | null | undefined,
): Promise<string | null> {
  const wallet = walletAddress?.trim();
  if (!wallet) return null;
  const user = await db.user.findFirst({
    where: { walletAddress: { equals: wallet, mode: "insensitive" } },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function createSettlementNotification(input: {
  db?: DbClient;
  userId: string;
  walletAddress?: string | null;
  marketId: string;
  marketTitle: string;
  marketSlug?: string | null;
  amountBnb: number;
}): Promise<void> {
  const db = input.db ?? prisma;
  const amount = Number.isFinite(input.amountBnb) ? input.amountBnb : 0;
  await db.activity.create({
    data: {
      type: ActivityType.SETTLEMENT,
      userId: input.userId,
      marketId: input.marketId,
      isRead: false,
      title: "Settlement",
      payload: {
        notificationType: "SETTLEMENT",
        walletAddress: input.walletAddress ?? null,
        marketId: input.marketId,
        amount: amount,
        amountBnb: amount,
        wonBnb: amount,
        question: input.marketTitle,
        message: `You won ${amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} BNB on ${input.marketTitle}`,
        href: input.marketSlug ? `/markets/${input.marketSlug}` : null,
      },
    },
  });
}

export async function createApprovalNotification(input: {
  db?: DbClient;
  walletAddress: string | null | undefined;
  suggestionId: string;
  marketId: string;
  marketTitle: string;
  marketSlug?: string | null;
}): Promise<void> {
  const db = input.db ?? prisma;
  const userId = await resolveUserId(db, input.walletAddress);
  if (!userId) return;

  await db.activity.create({
    data: {
      type: ActivityType.APPROVAL,
      userId,
      marketId: input.marketId,
      isRead: false,
      title: "Suggestion approved",
      payload: {
        notificationType: "APPROVAL",
        walletAddress: input.walletAddress?.toLowerCase() ?? null,
        suggestionId: input.suggestionId,
        marketId: input.marketId,
        question: input.marketTitle,
        message: "Your market suggestion was approved!",
        href: input.marketSlug ? `/markets/${input.marketSlug}` : "/markets/community",
      },
    },
  });
}

export async function createVoteMilestoneNotification(input: {
  db?: DbClient;
  walletAddress: string | null | undefined;
  suggestionId: string;
  voteCount: number;
  question?: string | null;
}): Promise<void> {
  const db = input.db ?? prisma;
  const userId = await resolveUserId(db, input.walletAddress);
  if (!userId) return;

  await db.activity.create({
    data: {
      type: ActivityType.VOTE_MILESTONE,
      userId,
      isRead: false,
      title: "Vote milestone",
      payload: {
        notificationType: "VOTE",
        walletAddress: input.walletAddress?.toLowerCase() ?? null,
        suggestionId: input.suggestionId,
        voteCount: input.voteCount,
        votes: input.voteCount,
        question: input.question ?? null,
        message: `Your suggestion reached ${input.voteCount} votes!`,
        href: "/markets/community",
      },
    },
  });
}

export async function createRewardNotification(input: {
  db?: DbClient;
  walletAddress: string | null | undefined;
  marketId: string;
  marketTitle: string;
  marketSlug?: string | null;
  amountBnb: number;
}): Promise<void> {
  const db = input.db ?? prisma;
  const userId = await resolveUserId(db, input.walletAddress);
  if (!userId) return;
  const amount = Number.isFinite(input.amountBnb) ? input.amountBnb : 0;
  if (amount <= 0) return;

  await db.activity.create({
    data: {
      type: ActivityType.REWARD,
      userId,
      marketId: input.marketId,
      isRead: false,
      title: "Creator reward",
      payload: {
        notificationType: "REWARD",
        walletAddress: input.walletAddress?.toLowerCase() ?? null,
        marketId: input.marketId,
        amount,
        amountBnb: amount,
        rewardBnb: amount,
        question: input.marketTitle,
        message: `You earned ${amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} BNB in creator rewards from ${input.marketTitle}`,
        href: input.marketSlug ? `/markets/${input.marketSlug}` : "/portfolio",
      },
    },
  });
}

/** Returns the first vote milestone crossed when going from `previous` → `next`, else null. */
export function crossedVoteMilestone(
  previous: number,
  next: number,
): (typeof VOTE_MILESTONES)[number] | null {
  for (const milestone of VOTE_MILESTONES) {
    if (previous < milestone && next >= milestone) return milestone;
  }
  return null;
}
