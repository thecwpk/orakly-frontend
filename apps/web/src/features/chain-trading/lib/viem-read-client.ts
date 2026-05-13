import { createPublicClient, http } from "viem";
import { testBnbChain } from "@/providers/web3/chains";

const rpcOverride = process.env.NEXT_PUBLIC_TBNB_RPC_URL?.trim();

/**
 * Read-only viem client for simulations / allowance reads (same chain as wagmi config).
 */
export function createChainTradingPublicClient() {
  return createPublicClient({
    chain: testBnbChain,
    transport: http(rpcOverride || undefined),
  });
}
