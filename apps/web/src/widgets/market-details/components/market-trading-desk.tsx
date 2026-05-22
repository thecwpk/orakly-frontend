"use client";

import { formatCompactUsd } from "@orakly/utils";
import { ChevronRight, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { memo, useCallback, useState } from "react";
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
import { marketDetailPanelClass } from "./market-detail-section";

function parseLooseNumber(raw: string | undefined): number | null {
  if (raw == null || raw === "") return null;
  const n = Number.parseFloat(String(raw).replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Readable quote line — probabilities as ¢, USD-ish as compact, long junk trimmed. */
function formatExecPxLine(raw: string | undefined): string {
  if (raw == null || raw === "") return "—";
  const n = parseLooseNumber(raw);
  if (n == null) return raw.length > 16 ? `${raw.slice(0, 16)}…` : raw;
  if (n >= 0 && n <= 1) return `${(n * 100).toFixed(2)}¢`;
  return `${n.toFixed(n < 10 ? 4 : 2)}`;
}

function formatNotionalLine(raw: string | undefined): string {
  if (raw == null || raw === "") return "—";
  const n = parseLooseNumber(raw);
  if (n == null) return raw;
  return formatCompactUsd(n);
}

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
  odds,
  rt,
  midYes,
  compact = false,
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
  odds: MarketOddsDto | undefined;
  rt: MarketRealtimeSnapshot;
  midYes: number;
  /** Tighter panel — stats live in overview; used on market detail page. */
  compact?: boolean;
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
        marketDetailPanelClass,
        "flex flex-col",
        compact ? "gap-1.5 p-2" : "gap-2 p-2.5 sm:gap-2.5 sm:p-3",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[11px] font-semibold tabular-nums text-zinc-200">
          Mid {(midYes * 100).toFixed(1)}¢
        </p>
        <ConnectionPill className="shrink-0" />
      </div>

      {!marketId ?
        <div className="rounded-md bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-100 ring-1 ring-amber-500/25">
          Trading is not wired for this listing yet. Browse other open markets or check back later.
        </div>
      : null}

      {disabledHint ?
        <div className="rounded-md bg-rose-500/10 px-2.5 py-1.5 text-[11px] text-rose-100 ring-1 ring-rose-500/25">
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
            : "bg-[hsl(228_28%_15%/0.45)] text-zinc-500 ring-white/[0.08] hover:bg-[hsl(228_28%_18%/0.5)] hover:text-zinc-300",
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
            : "bg-[hsl(228_28%_15%/0.45)] text-zinc-500 ring-white/[0.08] hover:bg-[hsl(228_28%_18%/0.5)] hover:text-zinc-300",
          )}
        >
          NO <span className="ml-1 font-mono text-[10px] opacity-80">{noDisplay}</span>
        </button>
      </div>

      <div className="flex gap-1 rounded-md bg-[hsl(228_28%_13%/0.55)] p-0.5 ring-1 ring-white/[0.08]">
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
          className="mt-1 w-full rounded-md border border-white/[0.1] bg-[hsl(228_28%_10%/0.75)] px-2.5 py-1.5 font-mono text-[13px] text-white outline-none ring-0 placeholder:text-zinc-600 focus:border-cyan-500/40"
          placeholder="25"
        />
      </div>

      <div className="space-y-1 rounded-md bg-[hsl(228_28%_12%/0.55)] px-2 py-1.5 font-mono text-[10px] text-zinc-400 ring-1 ring-white/[0.06]">
        <div className="flex justify-between gap-2">
          <span className="shrink-0 text-zinc-500">Exec</span>
          <motion.span
            key={`${quote.dataUpdatedAt}-${quote.data?.execPrice ?? ""}`}
            initial={{ opacity: 0.55 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.14 }}
            className={cn(
              "min-w-0 text-right font-medium tabular-nums text-cyan-200/90",
              quote.isFetching && "text-cyan-300/70",
            )}
          >
            {quote.isFetching ? "…" : formatExecPxLine(quote.data?.execPrice)}
          </motion.span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-zinc-500">Notional</span>
          <span className="min-w-0 text-right tabular-nums text-zinc-200">
            {quote.isFetching ? "…" : formatNotionalLine(quote.data?.notionalUsd)}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-zinc-500">Fee</span>
          <span className="tabular-nums text-zinc-200">
            {quote.isFetching ? "…" : formatNotionalLine(quote.data?.feeUsd)}
          </span>
        </div>
        {!compact ? (
          <>
            <div className="flex justify-between gap-2 border-t border-white/[0.07] pt-1">
              <span className="text-zinc-500">After (YES)</span>
              <span className="min-w-0 text-right tabular-nums text-zinc-200">
                {quote.isFetching ? "…" : formatExecPxLine(quote.data?.impliedYesAfter)}
              </span>
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
          </>
        ) : null}
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
      {!compact ? (
        <p className="text-center text-[9px] leading-snug text-zinc-600">
          {tradingSignedIn ?
            "Modal execution · Portfolio reflects fills"
          : "Connect wallet and sign in from Wallet to enable trading."}
        </p>
      ) : null}
    </div>
  );
}

export const MarketTradingDesk = memo(MarketTradingDeskInner);
