import { createPublicClient, http } from "viem";
import { getBscTestnetRpcUrl } from "@/lib/chain-public-env";
import { testBnbChain } from "@/providers/web3/chains";

/**
 * Read-only viem client for simulations / allowance reads (same chain as wagmi config).
 */
export function createChainTradingPublicClient() {
  return createPublicClient({
    chain: testBnbChain,
    transport: http(getBscTestnetRpcUrl()),
  });
}
