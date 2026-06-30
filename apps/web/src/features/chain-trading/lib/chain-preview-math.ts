import { formatUnits } from "viem";
import type { EnrichedQuote } from "@/features/trading/lib/trade-math";

/**
 * Outcome token amounts from Market.sol previews/mints use collateral raw units
 * (e.g. 6 decimals for USDC), not ERC20's default 18-decimal display scale.
 */
export function formatOutcomeSharesFromWei(
  wei: bigint,
  collateralDecimals: number,
): number {
  if (wei <= 0n) return 0;
  return Number.parseFloat(formatUnits(wei, collateralDecimals));
}

export function enrichFromChainPreview(input: {
  direction: "BUY" | "SELL";
  outcome: "YES" | "NO";
  collateralDecimals: number;
  feeBps: number;
  /** Gross collateral in (BUY) — human units. */
  collateralInUsd: number;
  /** Estimated shares (human) when preview unavailable. */
  estimatedShares: number;
  previewSharesOutWei?: bigint;
  previewSell?: readonly [bigint, bigint];
  midYes: number;
}): EnrichedQuote {
  const { collateralDecimals, feeBps, direction, midYes } = input;
  const midPx = input.outcome === "YES" ? midYes : 1 - midYes;

  if (direction === "BUY") {
    const gross = Math.max(0, input.collateralInUsd);
    const fee = gross * (feeBps / 10_000);
    const net = gross - fee;
    const previewWei = input.previewSharesOutWei;
    const hasPreview = previewWei != null && previewWei > 0n;
    const shares = hasPreview
      ? formatOutcomeSharesFromWei(previewWei, collateralDecimals)
      : Math.max(0, input.estimatedShares);
    const execPrice =
      shares > 0
        ? clampProbability(net / shares)
        : midPx;

    return {
      quantity: shares,
      execPrice,
      notionalUsd: net,
      feeUsd: fee,
      totalDebitUsd: gross,
      netCreditUsd: Math.max(0, net - fee),
      impliedYesAfter: midYes,
      takerFeeBps: feeBps,
      isProvisional: !hasPreview,
    };
  }

  const shares = Math.max(0, input.estimatedShares);
  const sell = input.previewSell;
  const hasSellPreview =
    sell != null && (sell[0] > 0n || sell[1] > 0n);
  const collateralOut = hasSellPreview
    ? Number.parseFloat(formatUnits(sell[0], collateralDecimals))
    : 0;
  const fee = hasSellPreview
    ? Number.parseFloat(formatUnits(sell[1], collateralDecimals))
    : 0;
  const notional = collateralOut + fee;
  const execPrice =
    shares > 0
      ? clampProbability(notional / shares)
      : midPx;

  return {
    quantity: shares,
    execPrice,
    notionalUsd: notional,
    feeUsd: fee,
    totalDebitUsd: 0,
    netCreditUsd: collateralOut,
    impliedYesAfter: midYes,
    takerFeeBps: feeBps,
    isProvisional: !hasSellPreview,
  };
}

function clampProbability(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
