import type { NextRequest } from "next/server";
import { resolveWalletSessionFromCookies } from "@/server/wallet-auth/resolve-wallet-session";
import { TradingError } from "./errors";

/**
 * Resolves the acting user for simulated custodial trading:
 * optional dev override → explicit header → authenticated wallet session cookie.
 */
export async function requireTradingUserId(req: NextRequest): Promise<string> {
  const debug = process.env.TRADING_DEBUG_USER_ID?.trim();
  if (debug && process.env.NODE_ENV !== "production") {
    return debug;
  }

  const header =
    req.headers.get("x-trading-user-id") ?? req.headers.get("x-user-id");
  if (header?.trim()) {
    return header.trim();
  }

  const wallet = await resolveWalletSessionFromCookies();
  if (!wallet?.userId) {
    throw new TradingError(
      "UNAUTHORIZED",
      "Sign in with your wallet to trade",
      401,
    );
  }
  return wallet.userId;
}
