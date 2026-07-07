import { MarketTradeError } from "./errors.js";

export function requirePlatformLiquidityUserId(): string {
  const id = process.env.PLATFORM_LIQUIDITY_USER_ID;
  if (!id?.trim()) {
    throw new MarketTradeError(
      "CONFIG",
      "PLATFORM_LIQUIDITY_USER_ID is not configured",
      500,
    );
  }
  return id.trim();
}
