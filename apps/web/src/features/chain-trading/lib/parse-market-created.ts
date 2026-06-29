import { decodeEventLog, type Address, type TransactionReceipt } from "viem";
import { marketFactoryAbi } from "../abis/market-factory";

/** Decode new clone address from a mined `createMarket` transaction receipt. */
export function parseMarketCreatedAddress(
  receipt: TransactionReceipt,
  factory: Address,
): Address | null {
  const want = factory.toLowerCase();
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== want) continue;
    try {
      const decoded = decodeEventLog({
        abi: marketFactoryAbi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "MarketCreated") {
        const args = decoded.args as { market?: Address } | undefined;
        if (args?.market) return args.market;
      }
    } catch {
      continue;
    }
  }
  return null;
}
