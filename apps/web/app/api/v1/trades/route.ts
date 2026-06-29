import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ok } from "../_lib/response";
import { tradingJsonError } from "../_lib/trading-http";
import { requireTradingUserId } from "@/server/trading/auth-context";
import { listUserTrades } from "@/server/trading/queries";

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

/** Custodial fills are disabled — all trading goes through MetaMask + Market.sol. */
export async function POST(req: NextRequest) {
  try {
    await requireTradingUserId(req);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "CUSTODIAL_DISABLED",
          message:
            "Custodial trading is disabled. Connect MetaMask on BSC testnet and trade via the on-chain market contract.",
        },
      },
      { status: 410 },
    );
  } catch (e) {
    return tradingJsonError(e);
  }
}
