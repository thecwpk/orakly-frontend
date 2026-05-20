"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Layers } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  buildOrderBook,
  type OrderBookLevel,
} from "../lib/order-book";

type Side = "YES" | "NO";

function formatSize(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return n.toString();
}

// Single ladder row.
const Row = memo(function RowImpl({
  level,
  totalDepth,
  variant,
  isBest,
}: {
  level: OrderBookLevel;
  totalDepth: number;
  variant: "ask" | "bid";
  isBest?: boolean;
}) {
  const depthPct = Math.min(100, (level.cumulative / Math.max(1, totalDepth)) * 100);
  const isAsk = variant === "ask";
  return (
    <li
      className={cn(
        "relative grid items-center gap-2 px-3 py-1 font-mono text-[11px] tabular-nums",
        "[grid-template-columns:minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]",
        "transition-colors",
        isBest && "bg-white/[0.03]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 -z-10 origin-right rounded-l-sm",
          isAsk ? "bg-rose-500/[0.12]" : "bg-emerald-500/[0.12]",
        )}
        style={{ width: `${depthPct}%` }}
      />
      <span
        className={cn(
          "z-10 font-semibold",
          isAsk ? "text-rose-300" : "text-emerald-300",
        )}
      >
        {level.priceCents.toFixed(1)}¢
      </span>
      <span className="z-10 text-right text-zinc-300">{formatSize(level.size)}</span>
      <span className="z-10 text-right text-zinc-500">
        {formatSize(level.cumulative)}
      </span>
    </li>
  );
});

function SideToggle({
  side,
  onChange,
}: {
  side: Side;
  onChange: (s: Side) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Order book side"
      className="inline-flex items-center gap-0.5 rounded-md bg-[hsl(228_28%_12%/0.55)] p-0.5 ring-1 ring-white/[0.08]"
    >
      {(["YES", "NO"] as const).map((s) => {
        const active = s === side;
        const isYes = s === "YES";
        return (
          <button
            key={s}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(s)}
            className={cn(
              "rounded-sm px-2 py-1 text-[10.5px] font-bold transition",
              active
                ? isYes
                  ? "bg-cyan-500/15 text-cyan-100 ring-1 ring-cyan-400/30"
                  : "bg-violet-500/15 text-violet-100 ring-1 ring-violet-400/30"
                : "text-zinc-500 hover:text-zinc-300",
            )}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}

function MarketOrderBookInner({
  slug,
  midYes,
  liquidityUsd,
  className,
}: {
  slug: string;
  /** Mid YES probability (0..1). */
  midYes: number;
  liquidityUsd: number;
  className?: string;
}) {
  const [side, setSide] = useState<Side>("YES");

  const book = useMemo(
    () =>
      buildOrderBook({
        slug,
        side,
        midProb: midYes,
        liquidityUsd,
      }),
    [slug, side, midYes, liquidityUsd],
  );

  // Reverse asks so lowest ask is closest to the mid (market-standard layout).
  const asksDesc = useMemo(
    () => [...book.asks].reverse(),
    [book.asks],
  );

  const bestAsk = book.asks[0]?.priceCents ?? null;
  const bestBid = book.bids[0]?.priceCents ?? null;

  return (
    <div
      className={cn(
        "glass-panel-strong neon-edge-cyan flex flex-col overflow-hidden rounded-2xl",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            <Layers className="h-3 w-3" />
            Order book
          </p>
          <p className="text-sm font-medium text-white">
            {side} contracts · L2
          </p>
        </div>
        <SideToggle side={side} onChange={setSide} />
      </div>

      {/* column header */}
      <div className="grid items-center gap-2 border-b border-white/[0.04] px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-zinc-600 [grid-template-columns:minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Sum</span>
      </div>

      {/* asks (descending) */}
      <ul className="flex flex-col-reverse">
        {asksDesc.map((lvl) => (
          <Row
            key={`ask-${lvl.priceCents}`}
            level={lvl}
            totalDepth={book.totalDepth}
            variant="ask"
            isBest={lvl.priceCents === bestAsk}
          />
        ))}
      </ul>

      {/* mid + spread strip */}
      <motion.div
        layout
        className="grid items-center gap-2 border-y border-white/[0.06] bg-gradient-to-r from-cyan-500/5 via-white/[0.04] to-violet-500/5 px-3 py-1.5 text-[11px]"
        style={{
          gridTemplateColumns: "minmax(0,1fr) minmax(0,auto) minmax(0,1fr)",
        }}
      >
        <span className="inline-flex items-center gap-1 text-[10.5px] text-zinc-500">
          <ArrowUp className="h-2.5 w-2.5 text-rose-400" />
          Best ask{" "}
          <span className="font-mono text-zinc-300">
            {bestAsk !== null ? `${bestAsk.toFixed(1)}¢` : "—"}
          </span>
        </span>
        <span className="rounded-md bg-[hsl(228_26%_10%/0.65)] px-2 py-0.5 font-mono text-[10.5px] tabular-nums text-zinc-200 ring-1 ring-white/[0.09]">
          mid {book.midCents}¢ · spread {book.spreadBps}bps
        </span>
        <span className="inline-flex items-center justify-end gap-1 text-[10.5px] text-zinc-500">
          Best bid{" "}
          <span className="font-mono text-zinc-300">
            {bestBid !== null ? `${bestBid.toFixed(1)}¢` : "—"}
          </span>
          <ArrowDown className="h-2.5 w-2.5 text-emerald-400" />
        </span>
      </motion.div>

      {/* bids */}
      <ul className="flex flex-col">
        {book.bids.map((lvl) => (
          <Row
            key={`bid-${lvl.priceCents}`}
            level={lvl}
            totalDepth={book.totalDepth}
            variant="bid"
            isBest={lvl.priceCents === bestBid}
          />
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-white/[0.06] px-3 py-2 font-mono text-[10px] text-zinc-600">
        <span>
          Depth{" "}
          <span className="text-zinc-400">{formatSize(book.totalDepth)}</span>
        </span>
        <span className="hidden sm:inline">Synthetic — pre-orderbook backend</span>
      </div>
    </div>
  );
}

export const MarketOrderBook = memo(MarketOrderBookInner);
