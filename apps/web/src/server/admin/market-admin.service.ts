import { ActivityType, MarketStatus, Prisma } from "@prisma/client";
import { prisma } from "@orakly/database";
import { TradingError } from "@/server/trading/errors";
import { D1, clampPrice, toDec } from "@/server/trading/constants";

function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

export type AdminCreateMarketInput = {
  title: string;
  slug: string;
  description?: string | null;
  categoryId?: string | null;
  creatorId?: string | null;
  opensAt?: Date | null;
  closesAt: Date;
  takerFeeBps?: number;
  status?: MarketStatus;
};

export async function adminCreateMarket(input: AdminCreateMarketInput) {
  const slug = slugify(input.slug);
  if (!slug) {
    throw new TradingError("VALIDATION", "Invalid slug", 400);
  }

  const clash = await prisma.market.findUnique({ where: { slug }, select: { id: true } });
  if (clash) {
    throw new TradingError("CONFLICT", "Slug already taken", 409);
  }

  const mid = new Prisma.Decimal("0.5");
  return prisma.market.create({
    data: {
      title: input.title.trim(),
      slug,
      description: input.description?.trim() || null,
      categoryId: input.categoryId ?? null,
      creatorId: input.creatorId ?? null,
      status: input.status ?? MarketStatus.OPEN,
      opensAt: input.opensAt ?? new Date(),
      closesAt: input.closesAt,
      yesPrice: mid,
      noPrice: clampPrice(D1.minus(mid)),
      takerFeeBps: input.takerFeeBps ?? 25,
      makerFeeBps: 0,
      liquidityUsd: toDec(250_000),
      collateralPoolUsd: toDec(0),
    },
  });
}

export type AdminModerateMarketInput = {
  marketId: string;
  title?: string;
  description?: string | null;
  status?: MarketStatus;
  categoryId?: string | null;
};

export async function adminModerateMarket(input: AdminModerateMarketInput) {
  const market = await prisma.market.findUnique({ where: { id: input.marketId } });
  if (!market) {
    throw new TradingError("NOT_FOUND", "Market not found", 404);
  }

  const data: Prisma.MarketUpdateInput = {};
  if (input.title !== undefined) data.title = input.title.trim();
  if (input.description !== undefined) data.description = input.description?.trim() ?? null;
  if (input.status !== undefined) data.status = input.status;
  if (input.categoryId !== undefined) {
    data.category =
      input.categoryId ?
        { connect: { id: input.categoryId } }
      : { disconnect: true };
  }

  return prisma.market.update({
    where: { id: input.marketId },
    data,
  });
}

export async function adminRecordMarketCreatedActivity(input: {
  marketId: string;
  actorUserId: string | null;
  title: string;
}) {
  await prisma.activity.create({
    data: {
      type: ActivityType.MARKET_CREATED,
      userId: input.actorUserId,
      marketId: input.marketId,
      title: input.title,
      payload: {},
    },
  });
}
