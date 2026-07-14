import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { API_ERROR_CODES } from "../_lib/errors";
import { err, ok } from "../_lib/response";
import { getWalletPortfolioPage } from "@/server/queries/portfolio-page.service";
import { getUserPortfolio } from "@/server/trading/queries";
import { requireTradingUserId } from "@/server/trading/auth-context";
import { tradingJsonError } from "../_lib/trading-http";

function isWallet(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

/**
 * GET /api/v1/portfolio
 * - ?address=0x… — public wallet portfolio page (overview, open/closed/claimable)
 * - ?status=open|closed|claimable — filter returned positions (optional)
 * - legacy session auth without address — trading actor portfolio snapshot
 */
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address")?.trim();
  const statusRaw = req.nextUrl.searchParams.get("status")?.trim().toLowerCase();

  if (address) {
    if (!isWallet(address)) {
      return NextResponse.json(
        err(API_ERROR_CODES.VALIDATION, "Invalid wallet address"),
        { status: 400 },
      );
    }

    try {
      const page = await getWalletPortfolioPage(address);
      const status =
        statusRaw === "open" || statusRaw === "closed" || statusRaw === "claimable"
          ? statusRaw
          : "all";

      const filtered =
        status === "open"
          ? { ...page, closedPositions: [], claimablePositions: [] }
          : status === "closed"
            ? { ...page, openPositions: [], claimablePositions: [] }
            : status === "claimable"
              ? { ...page, openPositions: [], closedPositions: [] }
              : page;

      return NextResponse.json(ok(filtered), {
        headers: { "Cache-Control": "private, max-age=15" },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return NextResponse.json(err("PORTFOLIO_UNAVAILABLE", message), { status: 503 });
    }
  }

  try {
    const userId = await requireTradingUserId(req);
    const data = await getUserPortfolio(userId);
    return NextResponse.json(ok(data));
  } catch (e) {
    return tradingJsonError(e);
  }
}
