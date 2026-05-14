import { prisma } from "@orakly/database";
import { NextResponse } from "next/server";
import { API_ERROR_CODES } from "../../../../_lib/errors";
import { ok, err } from "../../../../_lib/response";
import { buildVolumeWindow } from "@/widgets/market-details/lib/volume-history";

type RouteCtx = { params: Promise<{ slug: string }> };

/** GET — deterministic 24h volume buckets from DB `volumeTotalUsd` + slug seed (no client Date churn). */
export async function GET(_req: Request, ctx: RouteCtx) {
  const { slug: raw } = await ctx.params;
  const slug = decodeURIComponent(raw);

  const market = await prisma.market.findUnique({
    where: { slug },
    select: { id: true, volumeTotalUsd: true },
  });

  if (!market) {
    return NextResponse.json(err(API_ERROR_CODES.NOT_FOUND, "Market not found"), {
      status: 404,
    });
  }

  const totalVolumeUsd = Number(market.volumeTotalUsd);
  const safeVol = Number.isFinite(totalVolumeUsd) ? totalVolumeUsd : 0;
  const serverNow = Date.now();

  const win = buildVolumeWindow({
    slug,
    marketId: market.id,
    totalVolumeUsd: safeVol,
    trades: [],
    nowMs: serverNow,
  });

  const rows = win.buckets.map((b) => ({
    at: b.at,
    label: b.label,
    buy: Math.round(b.buyUsd),
    sell: Math.round(b.sellUsd),
    cumulative: Math.round(b.cumulativeUsd),
  }));

  return NextResponse.json(
    ok({
      slug,
      marketId: market.id,
      generatedAt: serverNow,
      totalUsd: win.totalUsd,
      buyUsd: win.buyUsd,
      sellUsd: win.sellUsd,
      imbalance: win.imbalance,
      rows,
    }),
    {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
      },
    },
  );
}
