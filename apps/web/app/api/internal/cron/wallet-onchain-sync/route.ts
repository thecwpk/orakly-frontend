import { NextResponse } from "next/server";

import { runWalletOnChainCronBatch } from "@/server/wallet-onchain";

/**
 * Stale-user batch refresh — Bearer `CRON_SECRET`.
 * Complements client-triggered POST `/api/v1/wallet/onchain/sync` on serverless.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const result = await runWalletOnChainCronBatch();

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, walletOnChain: result });
}
