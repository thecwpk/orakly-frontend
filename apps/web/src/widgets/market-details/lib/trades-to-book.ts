import type { MarketTradeRowDto } from "@/shared/api/fetchers/market-trades";

export type OrderBookLevel = {
  priceCents: number;
  size: number;
  cumulative: number;
};

export type TradeDerivedBook = {
  asks: OrderBookLevel[];
  bids: OrderBookLevel[];
  midCents: number;
  spreadBps: number;
  totalDepth: number;
};

function parseNum(s: string): number {
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

/** Aggregate backend trade prints into bid/ask ladders (no synthetic liquidity). */
export function tradesToBook(
  trades: MarketTradeRowDto[],
  side: "YES" | "NO",
  midYes: number,
): TradeDerivedBook {
  const mid = side === "YES" ? midYes : 1 - midYes;
  const midCents = Math.round(mid * 1000) / 10;

  const filtered = trades.filter((t) => t.outcome === side);
  const byPrice = new Map<number, number>();

  for (const t of filtered) {
    const px = parseNum(t.price);
    const qty = parseNum(t.quantity);
    if (px <= 0 || qty <= 0) continue;
    const cents = Math.round(px * 1000) / 10;
    byPrice.set(cents, (byPrice.get(cents) ?? 0) + qty);
  }

  const entries = [...byPrice.entries()].sort((a, b) => a[0] - b[0]);

  const bids: OrderBookLevel[] = [];
  const asks: OrderBookLevel[] = [];
  let bidCum = 0;
  let askCum = 0;

  for (const [cents, size] of entries) {
    if (cents <= midCents) {
      bidCum += size;
      bids.push({ priceCents: cents, size, cumulative: bidCum });
    } else {
      askCum += size;
      asks.push({ priceCents: cents, size, cumulative: askCum });
    }
  }

  bids.sort((a, b) => b.priceCents - a.priceCents);
  asks.sort((a, b) => a.priceCents - b.priceCents);

  const bestAsk = asks[0]?.priceCents ?? midCents;
  const bestBid = bids[0]?.priceCents ?? midCents;
  const spreadBps = Math.round(Math.max(0, bestAsk - bestBid) * 100);

  return {
    asks,
    bids,
    midCents,
    spreadBps,
    totalDepth: bidCum + askCum,
  };
}
