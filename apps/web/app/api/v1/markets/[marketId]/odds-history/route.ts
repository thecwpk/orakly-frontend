import { prisma } from "@orakly/database";
import { NextResponse } from "next/server";
import { API_ERROR_CODES } from "../../../_lib/errors";
import { ok, err } from "../../../_lib/response";

type RouteCtx = { params: Promise<{ marketId: string }> };

/** GET — YES mid snapshots for probability chart (public read). */
export async function GET(req: Request, ctx: RouteCtx) {
  const { marketId } = await ctx.params;
  const url = new URL(req.url);
  const hoursRaw = Number.parseInt(url.searchParams.get("hours") ?? "168", 10);
  const hours = Math.min(24 * 30, Math.max(6, Number.isFinite(hoursRaw) ? hoursRaw : 168));
  const since = new Date(Date.now() - hours * 3_600_000);

  const market = await prisma.market.findUnique({
    where: { id: marketId },
    select: { id: true },
  });

  if (!market) {
    return NextResponse.json(err(API_ERROR_CODES.NOT_FOUND, "Market not found"), {
      status: 404,
    });
  }

  const rows = await prisma.marketOddsSnapshot.findMany({
    where: { marketId, recordedAt: { gte: since } },
    orderBy: { recordedAt: "asc" },
    take: 240,
    select: { midYes: true, recordedAt: true },
  });

  return NextResponse.json(
    ok(
      rows.map((r) => ({
        yes: Number(r.midYes),
        recordedAt: r.recordedAt.toISOString(),
      })),
    ),
    {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
      },
    },
  );
}
