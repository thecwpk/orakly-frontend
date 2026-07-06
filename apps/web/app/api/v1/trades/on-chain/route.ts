import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { OutcomeSide } from "@prisma/client";
import { ok } from "../../_lib/response";
import { tradingJsonError } from "../../_lib/trading-http";
import { triggerMetricsRefresh } from "@/server/analytics/trigger-refresh";
import { prisma } from "@orakly/database";
import { requireTradingUserId } from "@/server/trading/auth-context";
import { recordOnChainTrade } from "@/server/trading/record-on-chain-trade.service";

const bodySchema = z.object({
  marketId: z.string().uuid(),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  outcome: z.enum(["YES", "NO"]),
  direction: z.enum(["BUY", "SELL"]),
  price: z.string().min(1),
  quantity: z.string().min(1),
  notionalUsd: z.string().min(1),
  feeUsd: z.string().optional(),
});

/** POST — record a confirmed on-chain fill for activity tape + leaderboard. */
export async function POST(req: NextRequest) {
  try {
    const userId = await requireTradingUserId(req);
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION", message: "Invalid trade body" } },
        { status: 400 },
      );
    }

    const snapshot = await recordOnChainTrade({
      userId,
      marketId: parsed.data.marketId,
      txHash: parsed.data.txHash,
      outcome: parsed.data.outcome as OutcomeSide,
      direction: parsed.data.direction,
      price: parsed.data.price,
      quantity: parsed.data.quantity,
      notionalUsd: parsed.data.notionalUsd,
      feeUsd: parsed.data.feeUsd,
    });

    void prisma.market
      .findUnique({
        where: { id: parsed.data.marketId },
        select: { narrative: true },
      })
      .then((market) => {
        void triggerMetricsRefresh({
          marketId: parsed.data.marketId,
          narrativeSlug: market?.narrative ?? undefined,
          event: "trade",
        });
      });

    return NextResponse.json(ok(snapshot));
  } catch (e) {
    return tradingJsonError(e);
  }
}
