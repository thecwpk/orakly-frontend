"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Layers, Loader2 } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { useMarketTradesQuery } from "@/shared/api/hooks/useMarketTradesQuery";
import { cn } from "@/lib/utils";
import { marketDetailPanelClass } from "./market-detail-section";
import {
  tradesToBook,
  type OrderBookLevel,
} from "../lib/trades-to-book";

type Side = "YES" | "NO";

function formatSize(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return n.toString();
}

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
  marketId,
  midYes,
  className,
}: {
  marketId: string;
  midYes: number;
  className?: string;
}) {
  const [side, setSide] = useState<Side>("YES");
  const tradesQ = useMarketTradesQuery(marketId, 100);

  const book = useMemo(
    () => tradesToBook(tradesQ.data ?? [], side, midYes),
    [tradesQ.data, side, midYes],
  );

  const asksDesc = useMemo(() => [...book.asks].reverse(), [book.asks]);
  const bestAsk = book.asks[0]?.priceCents ?? null;
  const bestBid = book.bids[0]?.priceCents ?? null;

  return (
    <div
      className={cn(
        marketDetailPanelClass,
        "flex min-h-[240px] flex-col overflow-hidden md:min-h-[280px]",
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] px-2.5 py-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Layers className="h-3 w-3 shrink-0 text-zinc-500" />
          <span className="text-[11px] font-medium text-zinc-300">{side} tape</span>
          {tradesQ.isLoading && (
            <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />
          )}
        </div>
        <SideToggle side={side} onChange={setSide} />
      </div>

      <div className="grid shrink-0 items-center gap-2 border-b border-white/[0.04] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-600 [grid-template-columns:minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Sum</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-terminal">
        {book.totalDepth === 0 && !tradesQ.isLoading ? (
          <p className="px-3 py-6 text-center text-[11px] text-zinc-500">
            No trades yet for {side}
          </p>
        ) : (
          <>
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
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-white/[0.06] px-2.5 py-1.5 font-mono text-[9px] text-zinc-600">
        <span>
          Depth <span className="text-zinc-400">{formatSize(book.totalDepth)}</span>
        </span>
        <span>mid {book.midCents}¢</span>
      </div>
    </div>
  );
}

export const MarketOrderBook = memo(MarketOrderBookInner);
