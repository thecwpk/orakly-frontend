import { formatUnits } from "viem";
import type { EnrichedQuote } from "@/features/trading/lib/trade-math";

const SHARE_DECIMALS = 18;

export function enrichFromChainPreview(input: {
  direction: "BUY" | "SELL";
  outcome: "YES" | "NO";
  collateralDecimals: number;
  feeBps: number;
  /** Gross collateral in (BUY) — human units. */
  collateralInUsd: number;
  /** Shares in human units. */
  shares: number;
  previewSharesOutWei?: bigint;
  previewSell?: readonly [bigint, bigint];
  midYes: number;
}): EnrichedQuote {
  const { collateralDecimals, feeBps, direction, midYes } = input;

  if (direction === "BUY") {
    const gross = Math.max(0, input.collateralInUsd);
    const fee = gross * (feeBps / 10_000);
    const net = gross - fee;
    const shares =
      input.previewSharesOutWei != null
        ? Number.parseFloat(
            formatUnits(input.previewSharesOutWei, SHARE_DECIMALS),
          )
        : Math.max(0, input.shares);
    const execPrice = shares > 0 ? net / shares : input.outcome === "YES" ? midYes : 1 - midYes;

    return {
      quantity: shares,
      execPrice,
      notionalUsd: net,
      feeUsd: fee,
      totalDebitUsd: gross,
      netCreditUsd: Math.max(0, net - fee),
      impliedYesAfter: midYes,
      takerFeeBps: feeBps,
      isProvisional: input.previewSharesOutWei == null,
    };
  }

  const shares = Math.max(0, input.shares);
  const sell = input.previewSell;
  const collateralOut =
    sell != null
      ? Number.parseFloat(formatUnits(sell[0], collateralDecimals))
      : 0;
  const fee =
    sell != null
      ? Number.parseFloat(formatUnits(sell[1], collateralDecimals))
      : 0;
  const notional = collateralOut + fee;
  const execPrice = shares > 0 ? notional / shares : input.outcome === "YES" ? midYes : 1 - midYes;

  return {
    quantity: shares,
    execPrice,
    notionalUsd: notional,
    feeUsd: fee,
    totalDebitUsd: 0,
    netCreditUsd: collateralOut,
    impliedYesAfter: midYes,
    takerFeeBps: feeBps,
    isProvisional: sell == null,
  };
}
