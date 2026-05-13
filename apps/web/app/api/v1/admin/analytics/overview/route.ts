import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { MarketStatus } from "@prisma/client";
import { prisma } from "@orakly/database";
import { requireAdminPermission } from "@/server/admin/admin-session";
import { ok } from "../../../_lib/response";
import { adminJsonError } from "../../_lib/admin-http";

export async function GET(req: NextRequest) {
  try {
    await requireAdminPermission(req, "analytics.read");

    const dayAgo = new Date(Date.now() - 864e5);
    const weekAgo = new Date(Date.now() - 7 * 864e5);

    const [
      usersTotal,
      marketsByStatus,
      trades24h,
      trades7d,
      feeTotals,
      volume7d,
      moderationQueue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.market.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.trade.count({ where: { executedAt: { gte: dayAgo } } }),
      prisma.trade.count({ where: { executedAt: { gte: weekAgo } } }),
      prisma.platformFee.aggregate({
        _sum: { amountUsd: true },
        _count: { _all: true },
      }),
      prisma.trade.aggregate({
        where: { executedAt: { gte: weekAgo } },
        _sum: { notionalUsd: true },
      }),
      prisma.market.count({
        where: { status: { in: [MarketStatus.PAUSED, MarketStatus.DRAFT] } },
      }),
    ]);

    const statusMap = Object.fromEntries(
      marketsByStatus.map((r) => [r.status, r._count._all]),
    ) as Record<string, number>;

    return NextResponse.json(
      ok({
        usersTotal,
        marketsByStatus: statusMap,
        trades24h,
        trades7d,
        platformFeesUsd: feeTotals._sum.amountUsd?.toFixed() ?? "0",
        platformFeeEvents: feeTotals._count._all,
        volumeNotional7dUsd: volume7d._sum.notionalUsd?.toFixed() ?? "0",
        moderationQueue,
      }),
    );
  } catch (e) {
    return adminJsonError(e);
  }
}
