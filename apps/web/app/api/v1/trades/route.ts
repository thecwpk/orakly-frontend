import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { proxyToExpress } from "@/server/orakly-express-proxy";
import { requireTradingUserId } from "@/server/trading/auth-context";
import { tradingJsonError } from "../_lib/trading-http";

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
    return proxyToExpress(req, "/api/v1/trades", { userId });
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

    return proxyToExpress(req, "/api/v1/trades", {
      userId,
      method: "POST",
      idempotencyKey,
      body: {
        userId,
        marketId: parsed.data.marketId,
        side: parsed.data.side,
        direction: parsed.data.direction,
        quantity: parsed.data.quantity,
        clientSeq: parsed.data.clientSeq,
      },
    });
  } catch (e) {
    return tradingJsonError(e);
  }
}
