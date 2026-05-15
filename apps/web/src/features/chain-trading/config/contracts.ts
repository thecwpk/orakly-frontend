import type { Address } from "viem";
import { getChainMarketTradeAddressRaw } from "@/lib/chain-public-env";

/**
 * Settlement / CLOB adapter on BSC testnet.
 * Set `NEXT_PUBLIC_CHAIN_MARKET_TRADE_ADDRESS` or `NEXT_PUBLIC_FACTORY_ADDRESS`.
 */
export function getChainMarketTradeAddress(): Address | null {
  const raw = getChainMarketTradeAddressRaw();
  if (!raw || raw === "0x" || raw === "0x0") return null;
  return raw as Address;
}

export function isChainTradingConfigured(): boolean {
  return getChainMarketTradeAddress() !== null;
}
