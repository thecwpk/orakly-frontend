import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ok } from "../../../_lib/response";
import { tradingJsonError } from "../../../_lib/trading-http";
import { requireTradingUserId } from "@/server/trading/auth-context";
import { syncWalletOnChainBalances } from "@/server/wallet-onchain";

const bodySchema = z
  .object({
    force: z.boolean().optional(),
  })
  .optional();

/**
 * Pull native + configured ERC-20 balances into Postgres (multicall, cooldown-aware).
 * Portfolio GET stays read-only from DB so this route can run on an interval or after connect.
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await requireTradingUserId(req);
    let force = false;
    try {
      const raw = await req.text();
      if (raw.trim()) {
        const parsed = bodySchema.safeParse(JSON.parse(raw));
        if (parsed.success && parsed.data?.force) force = true;
      }
    } catch {
      /* malformed or empty body */
    }

    const result = await syncWalletOnChainBalances({ userId, force });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: { code: "SYNC_FAILED", message: result.error } },
        { status: 500 },
      );
    }

    return NextResponse.json(ok(result));
  } catch (e) {
    return tradingJsonError(e);
  }
}
