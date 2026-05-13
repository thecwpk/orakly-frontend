import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { executeMarketTrade } from "@/server/trading/trade.service";
import { listUserTrades } from "@/server/trading/queries";
import { requireTradingUserId } from "@/server/trading/auth-context";
import { ok } from "../_lib/response";
import { tradingJsonError } from "../_lib/trading-http";

const bodySchema = z.object({
  marketId: z.string().uuid(),
  outcome: z.enum(["YES", "NO"]),
  direction: z.enum(["BUY", "SELL"]),
  quantity: z.union([z.string(), z.number()]),
  clientSeq: z.number().int().optional(),
  idempotencyKey: z.string().min(1).max(128).optional(),
});

const querySchema = z.object({
  take: z.coerce.number().int().min(1).max(200).optional(),
  cursor: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const userId = await requireTradingUserId(req);
    const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = querySchema.safeParse(sp);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION", message: parsed.error.message } },
        { status: 400 },
      );
    }

    const data = await listUserTrades({
      userId,
      take: parsed.data.take,
      cursor: parsed.data.cursor ?? null,
    });

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

    const q = new Prisma.Decimal(
      typeof parsed.data.quantity === "number" ?
        parsed.data.quantity.toFixed(12)
      : parsed.data.quantity,
    );

    const snapshot = await executeMarketTrade({
      userId,
      marketId: parsed.data.marketId,
      outcome: parsed.data.outcome,
      direction: parsed.data.direction,
      quantity: q,
      clientSeq: parsed.data.clientSeq,
      idempotencyKey: parsed.data.idempotencyKey ?? null,
    });

    return NextResponse.json(ok(snapshot));
  } catch (e) {
    return tradingJsonError(e);
  }
}
