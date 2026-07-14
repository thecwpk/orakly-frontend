import { NextResponse } from "next/server";
import { prisma } from "@orakly/database";
import { API_ERROR_CODES } from "../../../_lib/errors";
import { ok, err } from "../../../_lib/response";

type RouteCtx = { params: Promise<{ marketId: string }> };

/** GET — recent market fills (detail table + legacy consumers). */
export async function GET(req: Request, ctx: RouteCtx) {
  const { marketId } = await ctx.params;
  const url = new URL(req.url);
  const takeRaw = Number.parseInt(url.searchParams.get("take") ?? "50", 10);
  const skipRaw = Number.parseInt(url.searchParams.get("skip") ?? "0", 10);
  const take = Math.min(100, Math.max(1, Number.isFinite(takeRaw) ? takeRaw : 50));
  const skip = Math.max(0, Number.isFinite(skipRaw) ? skipRaw : 0);

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
    skip,
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
      externalRef: true,
      executedAt: true,
      taker: { select: { walletAddress: true } },
      buyer: { select: { walletAddress: true } },
    },
  });

  return NextResponse.json(
    ok(
      rows.map((t) => {
        const direction = t.takerId === t.buyerId ? ("BUY" as const) : ("SELL" as const);
        const walletAddress =
          t.taker.walletAddress?.toLowerCase() ||
          t.buyer.walletAddress?.toLowerCase() ||
          null;
        const ref = t.externalRef?.trim() || null;
        const txHash = ref && /^0x[a-fA-F0-9]{64}$/.test(ref) ? ref : null;
        const sideOutcome = t.outcome === "NO" ? ("NO" as const) : ("YES" as const);

        return {
          id: t.id,
          marketId: t.marketId,
          outcome: t.outcome,
          price: t.price.toFixed(),
          quantity: t.quantity.toFixed(),
          notionalUsd: t.notionalUsd.toFixed(),
          buyerId: t.buyerId,
          sellerId: t.sellerId,
          side: direction,
          executedAt: t.executedAt.toISOString(),
          // Detail table fields
          time: t.executedAt.toISOString(),
          walletAddress,
          sideOutcome,
          amount: Number(t.notionalUsd),
          shares: Number(t.quantity),
          txHash,
        };
      }),
    ),
    {
      headers: {
        "Cache-Control": "private, max-age=15, stale-while-revalidate=45",
      },
    },
  );
}
