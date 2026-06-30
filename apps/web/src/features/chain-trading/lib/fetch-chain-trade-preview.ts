import { parseUnits, type Address } from "viem";
import type { EnrichedQuote } from "@/features/trading/lib/trade-math";
import { marketAbi } from "../abis/market";
import { collateralDecimals } from "./chain-contract-env";
import { enrichFromChainPreview } from "./chain-preview-math";
import { createChainTradingPublicClient } from "./viem-read-client";

const SHARE_DECIMALS = 18;

export type FetchChainTradePreviewInput = {
  marketAddress: Address;
  outcome: "YES" | "NO";
  direction: "BUY" | "SELL";
  amount: number;
  midYes: number;
};

/**
 * Read fee + preview from Market.sol via a public RPC client (no wallet required).
 */
export async function fetchChainTradePreview(
  input: FetchChainTradePreviewInput,
): Promise<EnrichedQuote> {
  const client = createChainTradingPublicClient();
  const decimals = collateralDecimals();
  const amountNum = Math.max(0, input.amount);

  const feeBps = Number(
    await client.readContract({
      address: input.marketAddress,
      abi: marketAbi,
      functionName: "feeBps",
    }),
  );

  if (input.direction === "BUY") {
    const collateralWei = parseUnits(amountNum.toFixed(decimals), decimals);
    const bps = BigInt(Math.min(feeBps, 200));
    const netCollateralWei = (collateralWei * (10_000n - bps)) / 10_000n;

    const previewFn = input.outcome === "YES" ? "previewBuyYes" : "previewBuyNo";
    const previewSharesOutWei = await client.readContract({
      address: input.marketAddress,
      abi: marketAbi,
      functionName: previewFn,
      args: [netCollateralWei],
    });

    return enrichFromChainPreview({
      direction: "BUY",
      outcome: input.outcome,
      collateralDecimals: decimals,
      feeBps,
      collateralInUsd: amountNum,
      shares: amountNum,
      previewSharesOutWei: previewSharesOutWei as bigint,
      midYes: input.midYes,
    });
  }

  const sharesWei = parseUnits(amountNum.toFixed(6), SHARE_DECIMALS);
  const previewFn =
    input.outcome === "YES" ? "previewSellYesOut" : "previewSellNoOut";
  const previewSell = (await client.readContract({
    address: input.marketAddress,
    abi: marketAbi,
    functionName: previewFn,
    args: [sharesWei],
  })) as readonly [bigint, bigint];

  return enrichFromChainPreview({
    direction: "SELL",
    outcome: input.outcome,
    collateralDecimals: decimals,
    feeBps,
    collateralInUsd: 0,
    shares: amountNum,
    previewSell,
    midYes: input.midYes,
  });
}
