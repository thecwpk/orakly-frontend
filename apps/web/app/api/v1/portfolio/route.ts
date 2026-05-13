import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getUserPortfolio } from "@/server/trading/queries";
import { requireTradingUserId } from "@/server/trading/auth-context";
import { ok } from "../_lib/response";
import { tradingJsonError } from "../_lib/trading-http";

export async function GET(req: NextRequest) {
  try {
    const userId = await requireTradingUserId(req);
    const data = await getUserPortfolio(userId);
    return NextResponse.json(ok(data));
  } catch (e) {
    return tradingJsonError(e);
  }
}
