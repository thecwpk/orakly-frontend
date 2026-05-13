import type { Market } from "@orakly/types";
import type { PortfolioSnapshot } from "@/shared/api/fetchers/portfolio";
import type { TradeRow } from "@/shared/api/fetchers/trades";

export function parseUsd(s: string | null | undefined): number {
  if (s == null || s === "") return 0;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function positionMarkPrice(p: PortfolioSnapshot["positions"][number]): number {
  return p.side === "YES" ? parseUsd(p.market.yesPrice) : parseUsd(p.market.noPrice);
}

/** Cash + marked positions (qty × mark). */
export function computeEquityUsd(snapshot: PortfolioSnapshot): number {
  const w = snapshot.wallet;
  const cash =
    w ? parseUsd(w.availableBalanceUsd) + parseUsd(w.lockedBalanceUsd) : 0;
  let marks = 0;
  for (const p of snapshot.positions) {
    marks += parseUsd(p.quantity) * positionMarkPrice(p);
  }
  return cash + marks;
}

export function computeUnrealizedPnlUsd(snapshot: PortfolioSnapshot): number {
  let u = 0;
  for (const p of snapshot.positions) {
    const qty = parseUsd(p.quantity);
    const entry = parseUsd(p.avgEntryPrice);
    u += qty * (positionMarkPrice(p) - entry);
  }
  return u;
}

export type EquityPoint = { label: string; equity: number; at: string };

/**
 * Anchors cumulative trade cashflows so the final point matches current equity.
 * BUY (as buyer): −notional − buyer fee. SELL (as seller): +notional − seller fee.
 */
export function computeAnchoredEquitySeries(
  trades: TradeRow[],
  userId: string,
  targetEndEquity: number,
): EquityPoint[] {
  const sorted = [...trades]
    .filter((t) => !t.optimistic && t.price !== "pending")
    .sort((a, b) => new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime());

  if (sorted.length === 0) {
    const now = new Date().toISOString();
    return [
      { label: "", equity: targetEndEquity, at: now },
      { label: "", equity: targetEndEquity, at: now },
    ];
  }

  let flow = 0;
  const flows: number[] = [];
  for (const tr of sorted) {
    const n = parseUsd(tr.notionalUsd);
    const buyer = tr.buyerId === userId;
    const seller = tr.sellerId === userId;
    let delta = 0;
    if (buyer && tr.side === "BUY") {
      delta = -n - parseUsd(tr.feeBuyerUsd);
    } else if (seller && tr.side === "SELL") {
      delta = n - parseUsd(tr.feeSellerUsd);
    }
    flow += delta;
    flows.push(flow);
  }

  const totalFlow = flow;
  const points: EquityPoint[] = [];
  points.push({
    label: "Start",
    equity: targetEndEquity - totalFlow,
    at: sorted[0]!.executedAt,
  });

  sorted.forEach((tr, i) => {
    const cum = flows[i] ?? 0;
    points.push({
      label: "",
      equity: targetEndEquity - totalFlow + cum,
      at: tr.executedAt,
    });
  });

  return points;
}

export type WinRateResult = {
  winRatePct: number | null;
  closedQty: number;
  winningQty: number;
};

/**
 * FIFO match per (marketId:outcome). A sell lot is a "win" if execution price > matched cost basis.
 */
export function computeWinRateFromTrades(trades: TradeRow[], userId: string): WinRateResult {
  type Lot = { qty: number; price: number };
  const books = new Map<string, Lot[]>();

  const sorted = [...trades]
    .filter((t) => !t.optimistic && t.price !== "pending")
    .sort((a, b) => new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime());

  let winningQty = 0;
  let closedQty = 0;

  for (const tr of sorted) {
    const key = `${tr.marketId}:${tr.outcome}`;
    const qty = parseUsd(tr.quantity);
    const px = parseUsd(tr.price);
    if (qty <= 0 || px <= 0) continue;

    if (tr.side === "BUY" && tr.buyerId === userId) {
      const arr = books.get(key) ?? [];
      arr.push({ qty, price: px });
      books.set(key, arr);
      continue;
    }

    if (tr.side === "SELL" && tr.sellerId === userId) {
      let remaining = qty;
      const arr = books.get(key) ?? [];
      while (remaining > 1e-9 && arr.length > 0) {
        const lot = arr[0]!;
        const take = Math.min(remaining, lot.qty);
        closedQty += take;
        if (px > lot.price) winningQty += take;
        lot.qty -= take;
        remaining -= take;
        if (lot.qty <= 1e-9) arr.shift();
      }
      books.set(key, arr);
    }
  }

  if (closedQty <= 0) return { winRatePct: null, closedQty: 0, winningQty: 0 };
  return {
    winRatePct: (winningQty / closedQty) * 100,
    closedQty,
    winningQty,
  };
}

/** Per-position marked notional (USD). */
export function positionNotionalUsd(p: PortfolioSnapshot["positions"][number]): number {
  const qty = parseUsd(p.quantity);
  return qty * positionMarkPrice(p);
}

/** Gross marked book / equity — how much capital is working vs idle cash. */
export function computeGrossExposure(
  snapshot: PortfolioSnapshot,
  equityUsd: number,
): { pctOfEquity: number; notionalUsd: number } {
  let notionalUsd = 0;
  for (const p of snapshot.positions) {
    notionalUsd += positionNotionalUsd(p);
  }
  const denom = Math.max(equityUsd, 1e-9);
  return { pctOfEquity: (notionalUsd / denom) * 100, notionalUsd };
}

/** Mark − avg entry, in cents (probability drift on the held contract). */
export function positionProbDeltaCents(p: PortfolioSnapshot["positions"][number]): number | null {
  const entry = parseUsd(p.avgEntryPrice);
  const mark = positionMarkPrice(p);
  if (!Number.isFinite(entry) || !Number.isFinite(mark)) return null;
  return (mark - entry) * 100;
}

/** YES consensus mid as percent for tape-style columns (null when quote missing). */
export function positionYesMidPct(p: PortfolioSnapshot["positions"][number]): number | null {
  const y = parseUsd(p.market.yesPrice);
  if (!Number.isFinite(y) || y <= 0) return null;
  return Math.round(Math.min(1, Math.max(0, y)) * 100);
}

export type ExposureSlice = {
  marketId: string;
  slug: string;
  title: string;
  side: "YES" | "NO";
  notionalUsd: number;
  /** Share of total equity (0–100). */
  pctOfEquity: number;
  category: string;
};

/**
 * Breaks open-book exposure by market. `% of equity` uses total equity
 * (cash + marks). Optional feed lookup adds category labels for routing UX.
 */
export function computeMarketExposure(
  snapshot: PortfolioSnapshot,
  equityUsd: number,
  feedMarkets?: readonly Market[] | undefined,
): ExposureSlice[] {
  const catById = new Map<string, string>();
  const catBySlug = new Map<string, string>();
  if (feedMarkets) {
    for (const m of feedMarkets) {
      catById.set(m.id, m.category);
      catBySlug.set(m.slug, m.category);
      if (m.backendMarketId) catById.set(m.backendMarketId, m.category);
    }
  }

  const denom = Math.max(equityUsd, 1e-9);
  const slices: ExposureSlice[] = [];
  for (const p of snapshot.positions) {
    const n = positionNotionalUsd(p);
    const cat =
      catById.get(p.marketId) ??
      catBySlug.get(p.market.slug) ??
      catById.get(p.market.id) ??
      "Book";
    slices.push({
      marketId: p.marketId,
      slug: p.market.slug,
      title: p.market.title,
      side: p.side,
      notionalUsd: n,
      pctOfEquity: (n / denom) * 100,
      category: cat,
    });
  }
  return slices.sort((a, b) => b.notionalUsd - a.notionalUsd);
}

export type EquityRoiPoint = EquityPoint & { roiPct: number };

/** ROI vs first sample — percentage return on starting equity implied by the series. */
export function attachRoiPercent(points: EquityPoint[]): EquityRoiPoint[] {
  if (!points.length) return [];
  const start = points[0]!.equity;
  const base = Math.max(Math.abs(start), 1);
  return points.map((p) => ({
    ...p,
    roiPct: ((p.equity - start) / base) * 100,
  }));
}

/** Keeps endpoints; caps points for fast Recharts renders. */
export function downsampleEquityPoints(points: EquityPoint[], max = 96): EquityPoint[] {
  if (points.length <= max) return points;
  const lastIdx = points.length - 1;
  const out: EquityPoint[] = [];
  for (let i = 0; i < max; i++) {
    const t = i / (max - 1);
    const idx = Math.round(t * lastIdx);
    out.push(points[Math.min(idx, lastIdx)]!);
  }
  out[out.length - 1] = points[lastIdx]!;
  return out;
}
