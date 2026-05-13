import { NextResponse } from "next/server";

import { runChainIndexerSync } from "@/server/chain-indexer";

/**
 * Background indexer — Bearer `CRON_SECRET`.
 * Syncs contract logs into Postgres with confirmation depth + reorg rewind.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const result = await runChainIndexerSync();

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, index: result });
}
