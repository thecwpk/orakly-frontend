import "server-only";

import { prisma } from "@orakly/database";
import type { MarketCommentDto } from "@/shared/contracts/market-detail";

export async function listMarketComments(
  marketId: string,
  take = 50,
): Promise<MarketCommentDto[]> {
  const rows = await prisma.marketComment.findMany({
    where: { marketId },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(take, 1), 100),
    select: {
      id: true,
      marketId: true,
      body: true,
      createdAt: true,
      user: { select: { walletAddress: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    marketId: r.marketId,
    body: r.body,
    walletAddress: r.user.walletAddress?.toLowerCase() ?? null,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function createMarketComment(input: {
  marketId: string;
  userId: string;
  body: string;
}): Promise<MarketCommentDto> {
  const body = input.body.trim();
  if (!body) throw new Error("EMPTY_BODY");
  if (body.length > 2000) throw new Error("BODY_TOO_LONG");

  const market = await prisma.market.findUnique({
    where: { id: input.marketId },
    select: { id: true },
  });
  if (!market) throw new Error("MARKET_NOT_FOUND");

  const row = await prisma.marketComment.create({
    data: {
      marketId: input.marketId,
      userId: input.userId,
      body,
    },
    select: {
      id: true,
      marketId: true,
      body: true,
      createdAt: true,
      user: { select: { walletAddress: true } },
    },
  });

  return {
    id: row.id,
    marketId: row.marketId,
    body: row.body,
    walletAddress: row.user.walletAddress?.toLowerCase() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
