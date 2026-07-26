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

/** Admin create form category → DB category slug */
export const ADMIN_MARKET_CATEGORY_SLUGS: Record<string, string> = {
  meme: "meme-coins",
  defi: "crypto",
  layer1: "ecosystems",
  layer2: "ecosystems",
  ai: "tech",
  other: "crypto-narratives",
};

export type AdminCreateMarketInput = {
  title: string;
  slug: string;
  description?: string | null;
  categoryId?: string | null;
  /** Form category key (meme | defi | …) stored in generationMeta for display */
  adminCategory?: string | null;
  narrative?: string | null;
  resolutionSource?: string | null;
  creatorRewardPercent?: number;
  minimumBetBnb?: number;
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

async function resolveCategoryIdForAdminKey(
  adminCategory: string | null | undefined,
  explicitCategoryId: string | null | undefined,
): Promise<string | null> {
  if (explicitCategoryId) return explicitCategoryId;
  const key = adminCategory?.trim().toLowerCase();
  if (!key) return null;
  const slug = ADMIN_MARKET_CATEGORY_SLUGS[key];
  if (!slug) return null;
  const row = await prisma.category.findUnique({
    where: { slug },
    select: { id: true },
  });
  return row?.id ?? null;
}

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

  const categoryId = await resolveCategoryIdForAdminKey(
    input.adminCategory,
    input.categoryId,
  );

  const generationMeta =
    input.adminCategory || input.minimumBetBnb != null
      ? {
          ...(input.adminCategory ? { adminCategory: input.adminCategory } : {}),
          ...(input.minimumBetBnb != null
            ? { minimumBetBnb: input.minimumBetBnb }
            : {}),
        }
      : undefined;

  const market = await prisma.market.create({
    data: {
      title: input.title.trim(),
      slug,
      description: input.description?.trim() || null,
      categoryId,
      narrative: input.narrative?.trim() || null,
      resolutionSource: input.resolutionSource?.trim() || null,
      creatorRewardPercent: input.creatorRewardPercent ?? 0,
      creatorId: input.creatorId ?? null,
      status:
        input.onChainAddress
          ? (input.status ?? MarketStatus.OPEN)
          : MarketStatus.DRAFT,
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
      ...(generationMeta ? { generationMeta } : {}),
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

/** Hard-delete a market and trade/position rows that Restrict cascade. */
export async function adminDeleteMarket(marketId: string): Promise<{ id: string; title: string }> {
  const market = await prisma.market.findUnique({
    where: { id: marketId },
    select: { id: true, title: true },
  });
  if (!market) {
    throw new TradingError("NOT_FOUND", "Market not found", 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.position.deleteMany({ where: { marketId } });
    // PlatformFee cascades from Trade; Restrict on Market requires trades gone first.
    await tx.trade.deleteMany({ where: { marketId } });

    await tx.marketSuggestion.updateMany({
      where: { marketId },
      data: { marketId: null },
    });
    await tx.marketDraft.updateMany({
      where: { marketId },
      data: { marketId: null },
    });

    await tx.market.delete({ where: { id: marketId } });
  });

  return market;
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
