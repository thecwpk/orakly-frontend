import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { cacheTags } from "@/cache/next-tags";
import { refreshMarketTrendingMetrics } from "@/server/jobs";

/**
 * Rolling 24h tape → `volume24hUsd` + `trendingScore` from real `Trade` rows.
 * Schedule hourly (Vercel Cron) — Bearer `CRON_SECRET`.
 *
 * Set `VERCEL_CRON_TRENDING_ENABLED=false` when Railway worker owns this job.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  if (process.env.VERCEL_CRON_TRENDING_ENABLED === "false") {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "VERCEL_CRON_TRENDING_DISABLED",
    });
  }

  const result = await refreshMarketTrendingMetrics(24);
  revalidateTag(cacheTags.marketsFeed);

  return NextResponse.json({ ok: true, ...result });
}
