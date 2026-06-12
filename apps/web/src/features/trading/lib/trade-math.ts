import type { MarketQuoteDto } from "@/shared/api/fetchers/markets-live";

/** Safe float parse, treats invalid as null. */
export function parseFloatSafe(s: string | null | undefined): number | null {
  if (s == null || s === "") return null;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export type EnrichedQuote = {
  /** Quantity (shares) we're buying or selling. */
  quantity: number;
  /** Avg execution price per share (0..1). */
  execPrice: number;
  /** Total notional (price × qty), pre-fee. */
  notionalUsd: number;
  /** Taker fee charged on this fill. */
  feeUsd: number;
  /** Total debit on a BUY (cost). Equals notional + fee. */
  totalDebitUsd: number;
  /** Net credit on a SELL. */
  netCreditUsd: number;
  /** Implied YES probability after the fill. */
  impliedYesAfter: number;
  takerFeeBps: number;
};

/** Requires backend quote API — no client-side pricing fallback. */
export function enrichQuote(
  q: MarketQuoteDto | undefined,
  fallback: {
    midYes: number;
    quantity: number;
    direction: "BUY" | "SELL";
    outcome: "YES" | "NO";
  },
): EnrichedQuote {
  if (!q) {
    throw new Error("Quote unavailable — waiting for backend pricing");
  }

  const px = parseFloatSafe(q.execPrice);
  const notional = parseFloatSafe(q.notionalUsd);
  const fee = parseFloatSafe(q.feeUsd);
  const totalDebit = parseFloatSafe(q.totalDebitUsd);
  const netCredit = parseFloatSafe(q.netCreditUsd);
  const after = parseFloatSafe(q.impliedYesAfter);

  if (px == null || notional == null || fee == null || after == null) {
    throw new Error("Incomplete quote from backend");
  }

  return {
    quantity: fallback.quantity,
    execPrice: px,
    notionalUsd: notional,
    feeUsd: fee,
    totalDebitUsd: totalDebit ?? notional + fee,
    netCreditUsd: netCredit ?? Math.max(0, notional - fee),
    impliedYesAfter: after,
    takerFeeBps: q.takerFeeBps,
  };
}

/**
 * Convert a USD amount → number of shares at the given price.
 * Subtracts an estimated taker fee so the user's USD intent is honored.
 */
export function usdToShares(
  usd: number,
  pricePerShare: number,
  feeBps: number,
): number {
  if (pricePerShare <= 0) return 0;
  // share = usd / (price + price * feeBps/10_000)
  const effective = pricePerShare * (1 + feeBps / 10_000);
  return Math.max(0, usd / effective);
}

export type PayoutSummary = {
  /** Max payout if outcome resolves favorably (= shares × $1.00). */
  maxPayoutUsd: number;
  /** Profit if favorable (= maxPayout - totalDebit). */
  maxProfitUsd: number;
  /** ROI on capital deployed (0..∞). */
  maxRoi: number;
  /** Loss if unfavorable (= totalDebit). */
  maxLossUsd: number;
};

export function summarizePayout(quote: EnrichedQuote): PayoutSummary {
  // Each YES/NO share pays $1 if the outcome wins, $0 otherwise.
  const maxPayout = quote.quantity * 1;
  const maxProfit = Math.max(0, maxPayout - quote.totalDebitUsd);
  const maxLoss = quote.totalDebitUsd;
  const roi = quote.totalDebitUsd > 0 ? maxProfit / quote.totalDebitUsd : 0;
  return {
    maxPayoutUsd: maxPayout,
    maxProfitUsd: maxProfit,
    maxRoi: roi,
    maxLossUsd: maxLoss,
  };
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function formatUsd(n: number, opts?: { sign?: boolean }): string {
  const sign = opts?.sign && n > 0 ? "+" : "";
  if (Math.abs(n) >= 1000) {
    return `${sign}$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }
  return `${sign}$${n.toFixed(2)}`;
}

export function formatShares(n: number): string {
  if (n >= 1000) return `${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(4);
}

export function formatCents(probability: number): string {
  return `${(probability * 100).toFixed(1)}¢`;
}

export function formatPct(p: number, digits = 1): string {
  return `${(p * 100).toFixed(digits)}%`;
}
