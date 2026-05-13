"use client";

import type { Market } from "@orakly/types";
import { formatCompactUsd } from "@orakly/utils";
import { ChevronRight, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { memo, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { TradeModalMarket } from "@/features/trading/store/use-trade-modal-store";
import { useOpenTradeModal } from "@/features/trading";
import type { MarketOddsDto } from "@/shared/api/fetchers/markets-live";
import {
  useMarketQuoteDebouncedQuery,
  usePortfolioQuery,
} from "@/shared/api/hooks";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/shared/constants/routes";
import { useIsAuthenticated } from "@/state/selectors/auth.selectors";
import type { MarketRealtimeSnapshot } from "@/websocket/store/market-realtime-store";
import { useSocketRegistry } from "@/websocket/socket-registry";
import { buildMarketDetailStatCells } from "./market-stats-strip";

function ConnectionPill({ className }: { className?: string }) {
  const { connectionStatus: status } = useSocketRegistry();
  const label =
    status === "connected" ? "Live"
    : status === "connecting" ? "Sync…"
    : status === "error" ? "WS err"
    : "Offline";
  const color =
    status === "connected" ? "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30"
    : status === "connecting" ? "bg-amber-500/15 text-amber-200 ring-amber-500/25"
    : "bg-zinc-500/15 text-zinc-400 ring-white/10";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1",
        color,
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "connected" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
          : status === "connecting" ? "animate-pulse bg-amber-400"
          : "bg-zinc-500",
        )}
      />
      {label}
    </span>
  );
}

function MarketTradingDeskInner({
  marketId,
  userId,
  yesDisplay,
  noDisplay,
  disabledHint,
  tradeModalMarket,
  initialOutcome = "YES",
  market,
  odds,
  rt,
  midYes,
}: {
  marketId: string | null;
  userId: string | undefined;
  yesDisplay: string;
  noDisplay: string;
  disabledHint?: string | null;
  /** Opens global trade modal (compose → confirm → wallet / success). */
  tradeModalMarket: TradeModalMarket | null;
  /**
   * Side to preselect when the desk mounts. Pages can hydrate this from
   * `?side=YES|NO` so quick-trade affordances on market cards land users
   * directly on the right outcome.
   */
  initialOutcome?: "YES" | "NO";
  market: Market;
  odds: MarketOddsDto | undefined;
  rt: MarketRealtimeSnapshot;
  midYes: number;
}) {
  const [outcome, setOutcome] = useState<"YES" | "NO">(initialOutcome);
  const [direction, setDirection] = useState<"BUY" | "SELL">("BUY");
  const [qty, setQty] = useState("25");

  const portfolio = usePortfolioQuery(userId);
  const quote = useMarketQuoteDebouncedQuery(marketId ?? undefined, {
    outcome,
    direction,
    quantity: qty,
  });

  const openTradeModal = useOpenTradeModal();
  const tradingSignedIn = useIsAuthenticated();

  const canOpenTradeModal =
    Boolean(tradeModalMarket?.tradeMarketId) && !disabledHint;

  const openModal = useCallback(() => {
    if (!tradingSignedIn) return;
    if (!tradeModalMarket?.tradeMarketId) {
      toast.error("Trading is not available for this market yet.");
      return;
    }
    openTradeModal(tradeModalMarket, outcome);
  }, [tradingSignedIn, openTradeModal, outcome, tradeModalMarket]);

  const bal = portfolio.data?.wallet?.availableBalanceUsd;

  const statCells = useMemo(
    () => buildMarketDetailStatCells(market, odds, rt),
    [market, odds, rt],
  );

  const qtyNum = Number.parseFloat(qty.trim());
  const qtyOk = Number.isFinite(qtyNum) && qtyNum > 0;

  /** Binary payout ceiling: ~$1 per winning share (preview only). */
  const estMaxPayoutUsd =
    direction === "BUY" && qtyOk ? qtyNum : null;

  const debitStr = quote.data?.totalDebitUsd ?? quote.data?.notionalUsd;
  const debitNum = debitStr ? Number.parseFloat(String(debitStr).replace(/[^0-9.-]+/g, "")) : NaN;
  const estProfitIfWin =
    estMaxPayoutUsd != null && Number.isFinite(debitNum)
      ? estMaxPayoutUsd - debitNum
      : null;

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border border-white/[0.06] bg-[#07070d]/95 p-2 shadow-sm shadow-black/25 ring-1 ring-white/[0.06]",
        "sm:gap-2 sm:p-2.5",
        "lg:max-h-[calc(100vh-var(--app-topbar-h)-12px)] lg:overflow-y-auto lg:overscroll-contain",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
            Trade
          </p>
          <p className="font-mono text-[12px] font-semibold tabular-nums text-zinc-100">
            Mid {(midYes * 100).toFixed(1)}¢
          </p>
          <p className="text-[10px] text-zinc-500">Quote preview · modal confirms</p>
        </div>
        <ConnectionPill className="shrink-0" />
      </div>

      {!marketId ?
        <div className="rounded-xl bg-amber-500/10 px-3 py-2 text-[12px] text-amber-100 ring-1 ring-amber-500/25">
          Trading is not wired for this listing yet. Browse other open markets or check back later.
        </div>
      : null}

      {disabledHint ?
        <div className="rounded-xl bg-rose-500/10 px-3 py-2 text-[12px] text-rose-100 ring-1 ring-rose-500/25">
          {disabledHint}
        </div>
      : null}

      <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
        <button
          type="button"
          onClick={() => setOutcome("YES")}
          className={cn(
            "rounded-md px-2 py-[7px] text-center text-[11px] font-semibold transition ring-1 sm:py-2 sm:text-[12px]",
            outcome === "YES" ?
              "bg-cyan-500/15 text-cyan-100 ring-cyan-400/35"
            : "bg-black/25 text-zinc-500 ring-white/6 hover:text-zinc-300",
          )}
        >
          YES <span className="ml-1 font-mono text-[10px] opacity-80">{yesDisplay}</span>
        </button>
        <button
          type="button"
          onClick={() => setOutcome("NO")}
          className={cn(
            "rounded-md px-2 py-[7px] text-center text-[11px] font-semibold transition ring-1 sm:py-2 sm:text-[12px]",
            outcome === "NO" ?
              "bg-violet-500/15 text-violet-100 ring-violet-400/35"
            : "bg-black/25 text-zinc-500 ring-white/6 hover:text-zinc-300",
          )}
        >
          NO <span className="ml-1 font-mono text-[10px] opacity-80">{noDisplay}</span>
        </button>
      </div>

      <div className="flex gap-1 rounded-md bg-black/35 p-0.5 ring-1 ring-white/10">
        {(["BUY", "SELL"] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDirection(d)}
            className={cn(
              "flex-1 rounded py-1.5 text-[11px] font-bold tracking-wide transition",
              direction === d ?
                d === "BUY" ?
                  "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30"
                : "bg-rose-500/20 text-rose-100 ring-1 ring-rose-400/30"
              : "text-zinc-500 hover:text-zinc-300",
            )}
          >
            {d}
          </button>
        ))}
      </div>

      <div>
        <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Size (contracts)
        </label>
        <input
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          inputMode="decimal"
          className="mt-1 w-full rounded-md border border-white/8 bg-black/45 px-2.5 py-1.5 font-mono text-[13px] text-white outline-none ring-0 placeholder:text-zinc-600 focus:border-cyan-500/40"
          placeholder="25"
        />
      </div>

      <div className="space-y-1 rounded-lg bg-black/35 px-2.5 py-2 font-mono text-[10.5px] text-zinc-400 ring-1 ring-white/5">
        <div className="flex justify-between gap-2">
          <span>Exec px</span>
          <motion.span
            key={`${quote.dataUpdatedAt}-${quote.data?.execPrice ?? ""}`}
            initial={{ opacity: 0.55 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.14 }}
            className={cn(
              "font-medium text-cyan-200/90",
              quote.isFetching && "text-cyan-300/70",
            )}
          >
            {quote.isFetching ? "…" : (quote.data?.execPrice ?? "—")}
          </motion.span>
        </div>
        <div className="flex justify-between gap-2">
          <span>Notional</span>
          <span>{quote.data?.notionalUsd ?? "—"}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span>Fee</span>
          <span>{quote.data?.feeUsd ?? "—"}</span>
        </div>
        <div className="flex justify-between gap-2 border-t border-white/6 pt-1">
          <span>After (YES)</span>
          <span className="text-zinc-300">{quote.data?.impliedYesAfter ?? "—"}</span>
        </div>
        <div className="flex justify-between gap-2 border-t border-white/6 pt-1">
          <span className="text-zinc-500">Est. max payout</span>
          <span className="text-zinc-200">
            {estMaxPayoutUsd != null ? formatCompactUsd(estMaxPayoutUsd) : "—"}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-zinc-500">Est. P&amp;L if ITM</span>
          <span
            className={cn(
              estProfitIfWin != null &&
                estProfitIfWin > 0 &&
                "text-emerald-300/95",
              estProfitIfWin != null && estProfitIfWin < 0 && "text-rose-300/90",
            )}
          >
            {estProfitIfWin != null && Number.isFinite(estProfitIfWin) ?
              `${estProfitIfWin >= 0 ? "+" : ""}${formatCompactUsd(estProfitIfWin)}`
            : "—"}
          </span>
        </div>
      </div>

      <div className="hidden gap-1 sm:grid sm:grid-cols-2 sm:gap-1">
        {statCells.map((c, i) => (
          <div
            key={c.label}
            className={cn(
              "rounded-md bg-black/30 px-2 py-1.5 ring-1 ring-white/[0.05]",
              i === statCells.length - 1 && statCells.length % 2 === 1 && "col-span-2",
            )}
          >
            <p className="text-[8.5px] font-semibold uppercase tracking-wider text-zinc-600">
              {c.label}
            </p>
            <p className="mt-0.5 font-mono text-[11px] font-medium tabular-nums text-zinc-200">
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[10px] text-zinc-500">
        <span>Available</span>
        <span className="font-mono text-zinc-200">
          {userId ?
            bal != null ?
              formatCompactUsd(Number.parseFloat(bal))
            : portfolio.isLoading ?
              "…"
            : "—"
          : "—"}
        </span>
      </div>

      {!tradingSignedIn ? (
        <Link
          href={ROUTES.wallet}
          className="flex min-h-[44px] touch-manipulation items-center justify-center gap-2 rounded-lg bg-cyan-600/90 py-2 text-[12px] font-bold text-white ring-1 ring-cyan-400/35 transition hover:bg-cyan-600 sm:min-h-0 sm:py-2.5 sm:text-[13px]"
        >
          Log in to trade
          <ChevronRight className="h-4 w-4 opacity-80" />
        </Link>
      ) : (
        <button
          type="button"
          disabled={!canOpenTradeModal}
          onClick={openModal}
          className="flex min-h-[44px] touch-manipulation items-center justify-center gap-2 rounded-lg bg-cyan-600/90 py-2 text-[12px] font-bold text-white ring-1 ring-cyan-400/35 transition active:scale-[0.98] enabled:hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0 sm:py-2.5 sm:text-[13px]"
        >
          <Zap className="h-4 w-4" />
          Trade {outcome}
          <ChevronRight className="h-4 w-4 opacity-80" />
        </button>
      )}
      <p className="text-center text-[9px] leading-snug text-zinc-600">
        {tradingSignedIn ? "Modal execution · Portfolio reflects fills" : "Connect wallet and sign in from Wallet to enable trading."}
      </p>
    </div>
  );
}

export const MarketTradingDesk = memo(MarketTradingDeskInner);
