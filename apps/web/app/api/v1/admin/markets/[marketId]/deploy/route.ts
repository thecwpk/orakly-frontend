import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { MarketStatus } from "@prisma/client";
import { prisma } from "@orakly/database";
import {
  AdminAuthError,
  requireAdminPermission,
} from "@/server/admin/admin-session";
import { triggerMetricsRefresh } from "@/server/analytics/trigger-refresh";

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

type RouteCtx = { params: Promise<{ marketId: string }> };

export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    await requireAdminPermission(req, "markets.write");
    const { marketId: id } = await ctx.params;

    const body = (await req.json()) as { onChainAddress?: unknown };
    const { onChainAddress } = body;

    if (typeof onChainAddress !== "string" || !ADDRESS_RE.test(onChainAddress)) {
      return NextResponse.json(
        { error: "Invalid contract address" },
        { status: 400 },
      );
    }

    const existing = await prisma.market.findUnique({
      where: { id },
      select: { id: true, onChainAddress: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Market not found" }, { status: 404 });
    }

    if (existing.onChainAddress) {
      return NextResponse.json(
        { error: "Market already deployed" },
        { status: 409 },
      );
    }

    const market = await prisma.market.update({
      where: { id },
      data: {
        onChainAddress,
        status: MarketStatus.OPEN,
      },
    });

    revalidateTag("markets-feed");

    void triggerMetricsRefresh({ marketId: id, event: "create" });

    return NextResponse.json(market, { status: 200 });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.httpStatus });
    }
    console.error("[admin/markets/deploy]", e);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 },
    );
  }
}
