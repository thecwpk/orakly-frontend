import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { OutcomeSide, Prisma } from "@prisma/client";
import { z } from "zod";
import { ok } from "../_lib/response";
import { tradingJsonError } from "../_lib/trading-http";
import { requireTradingUserId } from "@/server/trading/auth-context";
import { listUserTrades } from "@/server/trading/queries";
import { executeMarketTrade } from "@/server/trading/trade.service";
import { narrativeSideToExecutionOutcome } from "@/shared/trading/narrative-trade-side";

const bodySchema = z.object({
  marketId: z.string().uuid(),
  side: z.enum(["FOR", "AGAINST"]),
  direction: z.enum(["BUY", "SELL"]),
  quantity: z.union([z.string(), z.number()]),
  clientSeq: z.number().int().optional(),
  idempotencyKey: z.string().min(8).max(128).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const userId = await requireTradingUserId(req);
    const take = Math.min(
      Number(req.nextUrl.searchParams.get("take") ?? 50),
      200,
    );
    const cursor = req.nextUrl.searchParams.get("cursor");
    const data = await listUserTrades({ userId, take, cursor });
    return NextResponse.json(ok(data));
  } catch (e) {
    return tradingJsonError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireTradingUserId(req);
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION", message: parsed.error.message } },
        { status: 400 },
      );
    }

    const idempotencyKey =
      parsed.data.idempotencyKey ??
      req.headers.get("idempotency-key") ??
      `web:${userId}:${parsed.data.marketId}:${Date.now()}`;

    const quantity = new Prisma.Decimal(
      typeof parsed.data.quantity === "number"
        ? parsed.data.quantity.toFixed(12)
        : parsed.data.quantity,
    );

    const outcome = narrativeSideToExecutionOutcome(
      parsed.data.side,
    ) as OutcomeSide;

    const snapshot = await executeMarketTrade({
      userId,
      marketId: parsed.data.marketId,
      outcome,
      direction: parsed.data.direction,
      quantity,
      clientSeq: parsed.data.clientSeq,
      idempotencyKey,
    });

    return NextResponse.json(ok(snapshot));
  } catch (e) {
    return tradingJsonError(e);
  }
}
