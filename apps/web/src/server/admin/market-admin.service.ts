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
  narrative?: string | null;
  creatorId?: string | null;
  opensAt?: Date | null;
  closesAt: Date;
  takerFeeBps?: number;
  liquidityUsd?: number;
  initialProbability?: number;
  status?: MarketStatus;
  onChainAddress?: string | null;
  chainId?: number | null;
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

  const mid =
    input.initialProbability != null
      ? clampPrice(toDec(input.initialProbability))
      : new Prisma.Decimal("0.5");

  const market = await prisma.market.create({
    data: {
      title: input.title.trim(),
      slug,
      description: input.description?.trim() || null,
      categoryId: input.categoryId ?? null,
      creatorId: input.creatorId ?? null,
      status: input.status ?? MarketStatus.DRAFT,
      opensAt: input.opensAt ?? new Date(),
      closesAt: input.closesAt,
      yesPrice: mid,
      noPrice: clampPrice(D1.minus(mid)),
      probability: mid,
      takerFeeBps: input.takerFeeBps ?? 25,
      makerFeeBps: 0,
      liquidityUsd: toDec(input.liquidityUsd ?? 25_000),
      collateralPoolUsd: toDec(0),
      onChainAddress: input.onChainAddress?.toLowerCase() ?? null,
      chainId: input.chainId ?? null,
    },
  });

  const narrative = input.narrative?.trim();
  if (narrative) {
    const categorySlug =
      market.categoryId
        ? (
            await prisma.category.findUnique({
              where: { id: market.categoryId },
              select: { slug: true },
            })
          )?.slug ?? "general"
        : "general";

    await prisma.marketSuggestion.create({
      data: {
        title: market.title,
        description: market.description,
        category: categorySlug,
        narrative,
        status: "APPROVED",
        marketId: market.id,
        submitterId: input.creatorId ?? null,
      },
    });
  }

  return market;
}

export type AdminModerateMarketInput = {
  marketId: string;
  title?: string;
  description?: string | null;
  status?: MarketStatus;
  categoryId?: string | null;
  onChainAddress?: string | null;
  chainId?: number | null;
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
  if (input.onChainAddress !== undefined) {
    data.onChainAddress = input.onChainAddress?.toLowerCase() ?? null;
  }
  if (input.chainId !== undefined) {
    data.chainId = input.chainId;
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
