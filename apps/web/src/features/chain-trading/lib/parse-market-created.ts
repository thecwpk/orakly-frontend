import { decodeEventLog, type Address, type TransactionReceipt } from "viem";
import { marketFactoryAbi } from "../abis/market-factory";

export type MarketCreatedEvent = {
  market: Address;
  question: string;
};

function decodeMarketCreatedLogs(
  receipt: TransactionReceipt,
  factory: Address,
): MarketCreatedEvent[] {
  const want = factory.toLowerCase();
  const out: MarketCreatedEvent[] = [];
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== want) continue;
    try {
      const decoded = decodeEventLog({
        abi: marketFactoryAbi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName !== "MarketCreated") continue;
      const args = decoded.args as {
        market?: Address;
        question?: string;
      };
      if (args.market) {
        out.push({
          market: args.market,
          question: args.question ?? "",
        });
      }
    } catch {
      continue;
    }
  }
  return out;
}

/** Decode new clone address from a mined `createMarket` transaction receipt. */
export function parseMarketCreatedAddress(
  receipt: TransactionReceipt,
  factory: Address,
): Address | null {
  return decodeMarketCreatedLogs(receipt, factory)[0]?.market ?? null;
}

/** Decode all `MarketCreated` clones from a (batch) factory receipt. */
export function parseMarketCreatedEvents(
  receipt: TransactionReceipt,
  factory: Address,
): MarketCreatedEvent[] {
  return decodeMarketCreatedLogs(receipt, factory);
}
