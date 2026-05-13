import { hashSlug } from "./series";

export type OrderBookLevel = {
  /** Price as cents/¢ — 0..100. */
  priceCents: number;
  /** Size in contracts. */
  size: number;
  /** Cumulative size from best price down. */
  cumulative: number;
};

export type OrderBookSnapshot = {
  side: "YES" | "NO";
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  midCents: number;
  spreadBps: number;
  totalDepth: number;
};

/**
 * Synthesize a believable L2 order book around `midProb` (0..1) for the given
 * outcome. Keeps inputs deterministic per (slug,outcome) so re-renders don't
 * flicker, but skews based on `liquidityUsd` so high-liquidity markets show
 * deeper, tighter books.
 *
 * Replace with a real fetcher when the trading backend exposes orderbook
 * snapshots — the shape (`OrderBookSnapshot`) is intentionally backend-friendly.
 */
export function buildOrderBook(args: {
  slug: string;
  side: "YES" | "NO";
  midProb: number;
  liquidityUsd: number;
  levels?: number;
}): OrderBookSnapshot {
  const { slug, side, midProb, liquidityUsd, levels = 8 } = args;
  const baseProb = side === "YES" ? midProb : 1 - midProb;
  const midCents = Math.max(1, Math.min(99, Math.round(baseProb * 100)));

  // Spread expands as price drifts from 50¢ (less informed → wider quotes).
  const distFrom50 = Math.abs(50 - midCents) / 50;
  const spreadCents = Math.max(0.5, 0.5 + distFrom50 * 1.5); // 0.5..2 cents
  const halfSpread = spreadCents / 2;

  const seed = hashSlug(`${slug}:${side}`);
  const rng = (n: number) => ((seed >> (n * 3)) & 1023) / 1023;

  // Liquidity heuristic — bigger pools => bigger quoted sizes
  const baseSize = Math.max(40, Math.min(2_500, liquidityUsd / 250));

  function ladder(direction: "asks" | "bids"): OrderBookLevel[] {
    const sign = direction === "asks" ? +1 : -1;
    const rows: OrderBookLevel[] = [];
    let cumulative = 0;
    for (let i = 0; i < levels; i++) {
      const stepCents = halfSpread + i * (0.5 + rng(i + 7) * 0.5);
      const priceCents =
        Math.round((midCents + sign * stepCents) * 10) / 10;
      if (priceCents <= 0 || priceCents >= 100) break;
      const sizeJitter = 0.6 + rng(i + 13) * 1.6;
      const decay = Math.pow(0.92, i);
      const size = Math.max(5, Math.round(baseSize * sizeJitter * decay));
      cumulative += size;
      rows.push({ priceCents, size, cumulative });
    }
    return rows;
  }

  const asks = ladder("asks");
  const bids = ladder("bids");

  const totalDepth =
    (asks[asks.length - 1]?.cumulative ?? 0) +
    (bids[bids.length - 1]?.cumulative ?? 0);

  // Spread in basis points (relative to 100¢ par).
  const spreadBps = Math.round(spreadCents * 100);

  return {
    side,
    bids,
    asks,
    midCents,
    spreadBps,
    totalDepth: Math.max(1, totalDepth),
  };
}
