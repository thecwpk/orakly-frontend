import { parseUnits, type Address } from "viem";
import type { EnrichedQuote } from "@/features/trading/lib/trade-math";
import { usdToShares } from "@/features/trading/lib/trade-math";
import { marketAbi } from "../abis/market";
import {
  collateralDecimals,
  outcomeShareDecimals,
} from "./chain-contract-env";
import { enrichFromChainPreview } from "./chain-preview-math";
import { createChainTradingPublicClient } from "./viem-read-client";

export type FetchChainTradePreviewInput = {
  marketAddress: Address;
  outcome: "YES" | "NO";
  direction: "BUY" | "SELL";
  amount: number;
  midYes: number;
};

function estimateBuyShares(
  grossUsd: number,
  outcome: "YES" | "NO",
  midYes: number,
  feeBps: number,
): number {
  const px = outcome === "YES" ? midYes : 1 - midYes;
  return usdToShares(grossUsd, px, feeBps);
}

/**
 * Read fee + preview from Market.sol via a public RPC client (no wallet required).
 */
export async function fetchChainTradePreview(
  input: FetchChainTradePreviewInput,
): Promise<EnrichedQuote> {
  const client = createChainTradingPublicClient();
  const decimals = collateralDecimals();
  const shareDecimals = outcomeShareDecimals();
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
      estimatedShares: estimateBuyShares(
        amountNum,
        input.outcome,
        input.midYes,
        feeBps,
      ),
      previewSharesOutWei: previewSharesOutWei as bigint,
      midYes: input.midYes,
    });
  }

  const sharesWei = parseUnits(
    amountNum.toFixed(shareDecimals),
    shareDecimals,
  );
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
    estimatedShares: amountNum,
    previewSell,
    midYes: input.midYes,
  });
}
