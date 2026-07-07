import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { cacheTags } from "@/cache/next-tags";
import {
  runCryptoIngestionPipeline,
  runNarrativeUpdatePipeline,
  runFullRecompute,
  refreshMarketTrendingMetrics,
} from "@/server/jobs";
import { refreshCryptoFeed } from "@/server/crypto-data/crypto-feed";

/**
 * Vercel-only worker bundle — replaces Railway BullMQ worker.
 * Bearer `CRON_SECRET`. Schedule 2×/day on Hobby, or every 10–15 min on Pro.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const started = Date.now();
  const results: Record<string, unknown> = {};

  try {
    revalidateTag(cacheTags.cryptoFeed);
    revalidateTag(cacheTags.marketsFeed);
    await refreshCryptoFeed();

    const ingestEnabled = process.env.VERCEL_CRON_INGEST_ENABLED !== "false";
    if (ingestEnabled) {
      results.ingest = await runCryptoIngestionPipeline();
    } else {
      results.ingest = { skipped: true };
    }

    results.narrative = await runNarrativeUpdatePipeline();

    const trendingEnabled = process.env.VERCEL_CRON_TRENDING_ENABLED !== "false";
    if (trendingEnabled) {
      results.trending = await refreshMarketTrendingMetrics(24);
    } else {
      results.trending = { skipped: true };
    }

    results.recompute = await runFullRecompute();

    revalidateTag(cacheTags.marketsFeed);

    return NextResponse.json({
      ok: true,
      elapsedMs: Date.now() - started,
      results,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
        elapsedMs: Date.now() - started,
        results,
      },
      { status: 500 },
    );
  }
}
