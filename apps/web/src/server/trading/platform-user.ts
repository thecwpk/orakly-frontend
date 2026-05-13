import { TradingError } from "./errors";

/** Custodial account that warehouses passive liquidity + receives trading/platform revenue in simulation. */
export function requirePlatformLiquidityUserId(): string {
  const id = process.env.PLATFORM_LIQUIDITY_USER_ID;
  if (!id?.trim()) {
    throw new TradingError(
      "CONFIG",
      "PLATFORM_LIQUIDITY_USER_ID is not configured",
      500,
    );
  }
  return id.trim();
}
