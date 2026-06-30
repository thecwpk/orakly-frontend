import { prisma } from "@orakly/database";
import { NextResponse } from "next/server";
import { prismaMarketToFeedDto } from "@/server/queries/market-feed-mapper";
import { API_ERROR_CODES } from "../../../_lib/errors";
import { err, ok } from "../../../_lib/response";

type RouteCtx = { params: Promise<{ slug: string }> };

/** GET /api/v1/markets/by-slug/:slug — single market for detail + trading (not directory slice). */
export async function GET(_req: Request, ctx: RouteCtx) {
  const { slug: raw } = await ctx.params;
  const slug = decodeURIComponent(raw).trim();
  if (!slug) {
    return NextResponse.json(err(API_ERROR_CODES.VALIDATION, "Missing slug"), {
      status: 400,
    });
  }

  const row = await prisma.market.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      volumeTotalUsd: true,
      liquidityUsd: true,
      yesPrice: true,
      closesAt: true,
      status: true,
      resolutionStatus: true,
      resolutionReason: true,
      resolvedOutcome: true,
      generationMeta: true,
      onChainAddress: true,
      chainId: true,
      category: { select: { name: true } },
      creator: { select: { displayName: true, walletAddress: true } },
    },
  });

  if (!row) {
    return NextResponse.json(err(API_ERROR_CODES.NOT_FOUND, "Market not found"), {
      status: 404,
    });
  }

  const market = prismaMarketToFeedDto(row);
  return NextResponse.json(
    ok({
      ...market,
      backendMarketId: row.id,
    }),
    {
      headers: {
        "Cache-Control": "public, s-maxage=5, stale-while-revalidate=30",
      },
    },
  );
}
