import type { Address } from "viem";

/**
 * Settlement / CLOB adapter contract on the configured wagmi chain (e.g. test BNB).
 * Replace when your audited `buyOutcomeShares`-compatible ABI is deployed.
 */
export function getChainMarketTradeAddress(): Address | null {
  const raw = process.env.NEXT_PUBLIC_CHAIN_MARKET_TRADE_ADDRESS?.trim();
  if (!raw || raw === "0x" || raw === "0x0") return null;
  return raw as Address;
}

export function isChainTradingConfigured(): boolean {
  return getChainMarketTradeAddress() !== null;
}
