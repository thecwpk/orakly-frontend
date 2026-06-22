import { prisma } from "@orakly/database";
import { NextResponse } from "next/server";
import { API_ERROR_CODES } from "../../../_lib/errors";
import { ok, err } from "../../../_lib/response";

type RouteCtx = { params: Promise<{ marketId: string }> };

/** GET — recent market fills from DB (public read for market detail UI). */
export async function GET(req: Request, ctx: RouteCtx) {
  const { marketId } = await ctx.params;
  const url = new URL(req.url);
  const takeRaw = Number.parseInt(url.searchParams.get("take") ?? "50", 10);
  const take = Math.min(100, Math.max(1, Number.isFinite(takeRaw) ? takeRaw : 50));

  const market = await prisma.market.findUnique({
    where: { id: marketId },
    select: { id: true },
  });

  if (!market) {
    return NextResponse.json(err(API_ERROR_CODES.NOT_FOUND, "Market not found"), {
      status: 404,
    });
  }

  const rows = await prisma.trade.findMany({
    where: { marketId },
    orderBy: { executedAt: "desc" },
    take,
    select: {
      id: true,
      marketId: true,
      outcome: true,
      price: true,
      quantity: true,
      notionalUsd: true,
      buyerId: true,
      sellerId: true,
      takerId: true,
      executedAt: true,
    },
  });

  return NextResponse.json(
    ok(
      rows.map((t) => ({
        id: t.id,
        marketId: t.marketId,
        outcome: t.outcome,
        price: t.price.toFixed(),
        quantity: t.quantity.toFixed(),
        notionalUsd: t.notionalUsd.toFixed(),
        buyerId: t.buyerId,
        sellerId: t.sellerId,
        side: t.takerId === t.buyerId ? ("BUY" as const) : ("SELL" as const),
        executedAt: t.executedAt.toISOString(),
      })),
    ),
    {
      headers: {
        "Cache-Control": "private, max-age=15, stale-while-revalidate=45",
      },
    },
  );
}
