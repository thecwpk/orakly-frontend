import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { cacheTags } from "@/cache/next-tags";
import { refreshCryptoFeed } from "@/server/crypto-data/crypto-feed";
import { runCryptoIngestionPipeline } from "@/server/ingestion";

/**
 * Vercel Cron — Bearer `CRON_SECRET`.
 * Warms Next cache, persists merged crypto signals, auto-creates draft markets.
 *
 * Set `VERCEL_CRON_INGEST_ENABLED=false` when Railway worker owns ingestion (avoid duplicate API pulls).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  if (process.env.VERCEL_CRON_INGEST_ENABLED === "false") {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "VERCEL_CRON_INGEST_DISABLED",
    });
  }

  revalidateTag(cacheTags.cryptoFeed);
  revalidateTag(cacheTags.marketsFeed);

  await refreshCryptoFeed();
  const ingest = await runCryptoIngestionPipeline();

  const status = ingest.status === "FAILED" ? 500 : 200;
  return NextResponse.json(
    {
      ok: ingest.status !== "FAILED",
      ingest,
    },
    { status },
  );
}
