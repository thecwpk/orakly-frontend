import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { quoteExecution } from "@/server/trading/queries";
import { narrativeSideToExecutionOutcome } from "@/shared/trading/narrative-trade-side";
import { ok, err } from "../../../_lib/response";
import { API_ERROR_CODES } from "../../../_lib/errors";

const querySchema = z.object({
  side: z.enum(["FOR", "AGAINST"]),
  direction: z.enum(["BUY", "SELL"]),
  quantity: z.union([z.string(), z.number()]),
});

type RouteCtx = { params: Promise<{ marketId: string }> };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const { marketId } = await ctx.params;
  const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = querySchema.safeParse(sp);
  if (!parsed.success) {
    return NextResponse.json(
      err(API_ERROR_CODES.VALIDATION, parsed.error.message),
      { status: 400 },
    );
  }

  const q = new Prisma.Decimal(
    typeof parsed.data.quantity === "number" ?
      parsed.data.quantity.toFixed(12)
    : parsed.data.quantity,
  );

  const outcome = narrativeSideToExecutionOutcome(parsed.data.side);

  const quote = await quoteExecution({
    marketId,
    outcome,
    direction: parsed.data.direction,
    quantity: q,
  });

  if (!quote) {
    return NextResponse.json(err(API_ERROR_CODES.NOT_FOUND, "Market not found"), {
      status: 404,
    });
  }

  return NextResponse.json(ok(quote));
}
