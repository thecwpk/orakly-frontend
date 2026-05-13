"use client";

import type { FeedActivityPayload } from "@orakly/realtime-protocol";
import { formatCompactUsd } from "@orakly/utils";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { memo, useMemo } from "react";
import { useLiveActivityFeed } from "@/websocket/hooks/useLiveActivityFeed";
import type { MarketRealtimeSnapshot } from "@/websocket/store/market-realtime-store";

type Row =
  | ({
      kind: "feed";
    } & FeedActivityPayload)
  | ({
      kind: "trade";
      tradeId: string;
      side: "BUY" | "SELL";
      outcome: "YES" | "NO";
      price: string;
      quantity: string;
      notionalUsd: string;
      at: number;
    });

function timeLabel(ms: number) {
  const d = new Date(ms);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function parseTradeNotionalUsd(s: string): number {
  const n = Number.parseFloat(String(s).replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(n) ? n : 0;
}

const DEFAULT_WHALE_USD = 2_500;

function MarketActivityFeedInner({
  tradeMarketId,
  rt,
  density = "comfortable",
  filter = "all",
  whaleMinUsd = DEFAULT_WHALE_USD,
  maxRows = 40,
  heading,
}: {
  tradeMarketId: string | null;
  rt: MarketRealtimeSnapshot;
  density?: "comfortable" | "compact";
  filter?: "all" | "trades-only" | "whales";
  whaleMinUsd?: number;
  maxRows?: number;
  heading?: { title: string; subtitle?: string };
}) {
  const feed = useLiveActivityFeed();

  const rows = useMemo<Row[]>(() => {
    const fromRt =
      tradeMarketId ?
        rt.tradesRecent.map(
          (t): Row => ({
            kind: "trade",
            tradeId: t.tradeId,
            side: t.side,
            outcome: t.outcome,
            price: t.price,
            quantity: t.quantity,
            notionalUsd: t.notionalUsd,
            at: t.at,
          }),
        )
      : [];

    const filteredFeed =
      tradeMarketId ?
        feed.filter((f) => f.marketId === tradeMarketId).map((f): Row => ({ kind: "feed", ...f }))
      : [];

    const merged = [...fromRt, ...filteredFeed];
    merged.sort((a, b) => {
      const ta = a.kind === "trade" ? a.at : a.at;
      const tb = b.kind === "trade" ? b.at : b.at;
      return tb - ta;
    });

    let out = merged;
    if (filter === "trades-only" || filter === "whales") {
      out = merged.filter((r) => r.kind === "trade");
    }
    if (filter === "whales") {
      out = out.filter(
        (r) =>
          r.kind === "trade" && parseTradeNotionalUsd(r.notionalUsd) >= whaleMinUsd,
      );
    }
    return out.slice(0, maxRows);
  }, [feed, filter, maxRows, rt.tradesRecent, tradeMarketId, whaleMinUsd]);

  const isCompact = density === "compact";
  const title = heading?.title ?? "Activity";
  const subtitle =
    heading?.subtitle ??
    (filter === "whales"
      ? `Prints ≥ ${formatCompactUsd(whaleMinUsd)}`
      : filter === "trades-only"
        ? "Recent trades"
        : "Trades & feed");

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-white/[0.06] bg-[#08080f]/90 ring-1 ring-white/[0.04]",
        !isCompact && "glass-panel-strong rounded-2xl",
      )}
    >
      <div
        className={cn("border-b border-white/6", isCompact ? "px-2.5 py-2" : "px-4 py-3")}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
          {title}
        </p>
        <p className={cn("font-medium text-white", isCompact ? "text-[12px]" : "text-sm")}>
          {subtitle}
        </p>
      </div>
      <ul
        className={cn(
          "divide-y divide-white/4 overflow-y-auto overscroll-contain",
          isCompact ? "max-h-[240px]" : "max-h-[320px]",
        )}
      >
        {rows.length === 0 ?
          <li
            className={cn(
              "text-center text-zinc-500",
              isCompact ? "px-3 py-6 text-[11px]" : "px-4 py-8 text-[12px]",
            )}
          >
            {tradeMarketId ?
              filter === "whales" ?
                "No whale prints in window."
              : "Waiting for live prints…"
            : "Subscribe to a market UUID to see filtered activity."}
          </li>
        : rows.map((row, i) =>
            row.kind === "trade" ?
              <motion.li
                key={`${row.tradeId}-${row.at}`}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className={cn(
                  "flex items-center gap-2 font-mono sm:gap-3",
                  isCompact ? "px-2.5 py-1.5 text-[10px]" : "gap-3 px-4 py-2.5 text-[11px]",
                )}
              >
                <span
                  className={cn(
                    "shrink-0 font-mono text-zinc-500",
                    isCompact ? "w-[62px]" : "w-[72px]",
                  )}
                >
                  {timeLabel(row.at)}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded px-1 py-0.5 text-center font-bold ring-1",
                    isCompact ? "w-[38px] text-[9px]" : "w-[42px] px-1.5 text-[11px]",
                    row.side === "BUY" ?
                      "bg-emerald-500/15 text-emerald-200 ring-emerald-500/25"
                    : "bg-rose-500/15 text-rose-100 ring-rose-500/25",
                  )}
                >
                  {row.side}
                </span>
                <span className="flex w-7 shrink-0 items-center gap-0.5 font-semibold text-zinc-300 sm:w-8 sm:gap-1">
                  {row.outcome}
                  {row.tradeId.startsWith("optimistic-local:") ?
                    <span className="rounded bg-amber-500/20 px-1 py-px text-[8px] font-bold uppercase leading-none text-amber-200 ring-1 ring-amber-500/35">
                      ···
                    </span>
                  : null}
                </span>
                <span className="flex-1 truncate font-mono text-zinc-400">
                  {row.quantity} @ {row.price}{" "}
                  <span className="text-zinc-600">({row.notionalUsd})</span>
                </span>
              </motion.li>
            : <motion.li
                key={`${row.activityId}-${i}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16 }}
                className={cn(isCompact ? "px-2.5 py-2 text-[10px]" : "px-4 py-2.5 text-[11px]")}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-zinc-500">{timeLabel(row.at)}</span>
                  <span className="rounded bg-white/6 px-1.5 py-0.5 text-[10px] uppercase text-zinc-400 ring-1 ring-white/10">
                    {row.activityType}
                  </span>
                </div>
                {row.title ?
                  <p className="mt-1 text-zinc-300">{row.title}</p>
                : null}
              </motion.li>,
          )
        }
      </ul>
    </div>
  );
}

export const MarketActivityFeed = memo(MarketActivityFeedInner);
