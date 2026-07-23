"use client";

import { formatCompactUsd } from "@orakly/utils";
import { ChevronRight, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import type { Address } from "viem";
import {
  useChainCollateralBalance,
  useOnChainTradePreview,
} from "@/features/chain-trading";
import type { TradeModalMarket } from "@/features/trading/store/use-trade-modal-store";
import { useOpenTradeModal } from "@/features/trading";
import type { MarketOddsDto } from "@/shared/api/fetchers/markets-live";
import {
  useMarketQuoteDebouncedQuery,
} from "@/shared/api/hooks";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/shared/constants/routes";
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
  if (raw == null || raw === "") return "N/A";
  const n = parseLooseNumber(raw);
  if (n == null) return raw.length > 16 ? `${raw.slice(0, 16)}…` : raw;
  if (n >= 0 && n <= 1) return `${(n * 100).toFixed(2)}¢`;
  return `${n.toFixed(n < 10 ? 4 : 2)}`;
}

function formatNotionalLine(raw: string | undefined): string {
  if (raw == null || raw === "") return "N/A";
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
  embedded = false,
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
  /** Skip outer panel chrome when parent already provides a surface. */
  embedded?: boolean;
}) {
  const [outcome, setOutcome] = useState<"YES" | "NO">(initialOutcome);
  const [direction, setDirection] = useState<"BUY" | "SELL">("BUY");
  const [qty, setQty] = useState("25");

  useEffect(() => {
    setOutcome(initialOutcome);
  }, [initialOutcome]);

  const openTradeModal = useOpenTradeModal();
  const { address, isConnected } = useAccount();
  const isOnChain = Boolean(tradeModalMarket?.onChainAddress);

  const custodialQuote = useMarketQuoteDebouncedQuery(
    isOnChain ? undefined : (marketId ?? undefined),
    {
      outcome,
      direction,
      quantity: qty,
    },
  );

  const qtyNum = Number.parseFloat(qty.trim());
  const qtyOk = Number.isFinite(qtyNum) && qtyNum > 0;
  const previewAmount =
    direction === "BUY" ? qtyNum : qtyNum;

  const chainPreview = useOnChainTradePreview({
    marketAddress: isOnChain
      ? (tradeModalMarket?.onChainAddress as Address)
      : null,
    outcome,
    direction,
    amount: previewAmount,
    midYes,
  });

  const collateralQ = useChainCollateralBalance(
    isOnChain ? (address as Address | undefined) : undefined,
  );

  const quoteFetching = isOnChain
    ? chainPreview.isFetching
    : custodialQuote.isFetching;

  const activeQuote = useMemo(() => {
    if (isOnChain) {
      const q = chainPreview.quote;
      return {
        execPrice: String(q.execPrice),
        notionalUsd: String(q.notionalUsd),
        feeUsd: String(q.feeUsd),
        impliedYesAfter: String(q.impliedYesAfter),
        totalDebitUsd: String(q.totalDebitUsd),
      };
    }
    return custodialQuote.data;
  }, [chainPreview.quote, custodialQuote.data, isOnChain]);

  const canOpenTradeModal = isOnChain && !disabledHint;

  const openModal = useCallback(() => {
    if (!isConnected) {
      toast.message("Connect MetaMask to trade on-chain.");
      return;
    }
    if (!tradeModalMarket?.onChainAddress) {
      toast.error("On-chain trading is not available for this market yet.");
      return;
    }
    openTradeModal(tradeModalMarket, outcome);
  }, [isConnected, openTradeModal, outcome, tradeModalMarket]);

  const bal = isOnChain ? collateralQ.data?.formatted : undefined;

  /** Binary payout ceiling: ~$1 per winning share (preview only). */
  const estMaxPayoutUsd =
    direction === "BUY" && qtyOk ? qtyNum : null;

  const debitStr = activeQuote?.totalDebitUsd ?? activeQuote?.notionalUsd;
  const debitNum = debitStr ? Number.parseFloat(String(debitStr).replace(/[^0-9.-]+/g, "")) : NaN;
  const estProfitIfWin =
    estMaxPayoutUsd != null && Number.isFinite(debitNum)
      ? estMaxPayoutUsd - debitNum
      : null;

  return (
    <div
      className={cn(
        !embedded && marketDetailPanelClass,
        "flex flex-col",
        embedded ? "gap-2 p-3 sm:p-4" : compact ? "gap-1.5 p-2" : "gap-2.5 p-3 sm:gap-3 sm:p-4",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[12px] font-semibold tabular-nums text-[var(--md-fg,#e8f0ff)]">
          Mid {(midYes * 100).toFixed(1)}¢
        </p>
        <ConnectionPill className="shrink-0" />
      </div>

      {!isOnChain ?
        <div className="rounded-md bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-100 ring-1 ring-amber-500/25">
          On-chain trading is not available for this market yet.
        </div>
      : null}

      {disabledHint ?
        <div className="rounded-md bg-rose-500/10 px-2.5 py-1.5 text-[11px] text-rose-100 ring-1 ring-rose-500/25">
          {disabledHint}
        </div>
      : null}

      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => setOutcome("YES")}
          className={cn(
            "rounded-lg px-2 py-2.5 text-center text-[12px] font-semibold transition sm:py-3 sm:text-[13px]",
            outcome === "YES"
              ? "bg-[var(--md-success-bg)] text-[var(--md-success)] ring-1 ring-[var(--md-success)]/35"
              : "bg-[color-mix(in_srgb,var(--md-bg-subtle)_70%,transparent)] text-[var(--md-muted)] ring-1 ring-[var(--md-border)] hover:text-[var(--md-fg)]",
          )}
        >
          Yes <span className="ml-1 font-mono text-[11px] opacity-90">{yesDisplay}</span>
        </button>
        <button
          type="button"
          onClick={() => setOutcome("NO")}
          className={cn(
            "rounded-lg px-2 py-2.5 text-center text-[12px] font-semibold transition sm:py-3 sm:text-[13px]",
            outcome === "NO"
              ? "bg-[var(--md-danger-bg)] text-[var(--md-danger)] ring-1 ring-[var(--md-danger)]/35"
              : "bg-[color-mix(in_srgb,var(--md-bg-subtle)_70%,transparent)] text-[var(--md-muted)] ring-1 ring-[var(--md-border)] hover:text-[var(--md-fg)]",
          )}
        >
          No <span className="ml-1 font-mono text-[11px] opacity-90">{noDisplay}</span>
        </button>
      </div>

      <div className="flex gap-1 rounded-lg bg-[color-mix(in_srgb,var(--md-bg-subtle)_65%,transparent)] p-0.5 ring-1 ring-[var(--md-border)]">
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
        <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--md-muted)]">
          Size (contracts)
        </label>
        <input
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          inputMode="decimal"
          className="mt-1 w-full rounded-lg border border-[var(--md-border)] bg-[color-mix(in_srgb,var(--md-bg-subtle)_80%,transparent)] px-3 py-2 font-mono text-[14px] text-[var(--md-fg)] outline-none placeholder:text-[var(--md-muted)] focus:border-[var(--md-primary)] focus:ring-2 focus:ring-[var(--md-primary)]/20"
          placeholder="25"
        />
      </div>

      <div className="space-y-1.5 rounded-lg bg-[color-mix(in_srgb,var(--md-bg-subtle)_55%,transparent)] px-3 py-2.5 font-mono text-[11px] text-[var(--md-muted)] ring-1 ring-[var(--md-border)]">
        <div className="flex justify-between gap-2">
          <span className="shrink-0 text-[var(--md-muted)]">Exec</span>
          <motion.span
            key={`${activeQuote?.execPrice ?? ""}-${quoteFetching}`}
            initial={{ opacity: 0.55 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.14 }}
            className={cn(
              "min-w-0 text-right font-medium tabular-nums text-[var(--md-primary-bright)]",
              quoteFetching && "opacity-70",
            )}
          >
            {quoteFetching ? "…" : formatExecPxLine(activeQuote?.execPrice)}
          </motion.span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-[var(--md-muted)]">Notional</span>
          <span className="min-w-0 text-right tabular-nums text-[var(--md-fg)]">
            {quoteFetching ? "…" : formatNotionalLine(activeQuote?.notionalUsd)}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-zinc-500">Fee</span>
          <span className="tabular-nums text-zinc-200">
            {quoteFetching ? "…" : formatNotionalLine(activeQuote?.feeUsd)}
          </span>
        </div>
        {!compact ? (
          <>
            <div className="flex justify-between gap-2 border-t border-white/[0.07] pt-1">
              <span className="text-zinc-500">After (YES)</span>
              <span className="min-w-0 text-right tabular-nums text-zinc-200">
                {quoteFetching ? "…" : formatExecPxLine(activeQuote?.impliedYesAfter)}
              </span>
            </div>
            <div className="flex justify-between gap-2 border-t border-white/6 pt-1">
              <span className="text-zinc-500">Est. max payout</span>
              <span className="text-zinc-200">
                {estMaxPayoutUsd != null ? formatCompactUsd(estMaxPayoutUsd) : "N/A"}
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
                : "N/A"}
              </span>
            </div>
          </>
        ) : null}
      </div>

      <div className="flex items-center justify-between text-[10px] text-zinc-500">
        <span>Collateral</span>
        <span className="font-mono text-zinc-200">
          {!isConnected
            ? "N/A"
            : bal != null
              ? formatCompactUsd(bal)
              : collateralQ.isLoading
                ? "…"
                : "N/A"}
        </span>
      </div>

      {!isConnected ? (
        <Link
          href={ROUTES.wallet}
          className="flex min-h-[48px] touch-manipulation items-center justify-center gap-2 rounded-lg bg-[var(--md-primary)] py-2.5 text-[13px] font-bold text-white shadow-[0_4px_14px_rgb(59_130_246_/_0.35)] transition hover:brightness-105 sm:min-h-0"
        >
          Connect wallet to trade
          <ChevronRight className="h-4 w-4 opacity-80" />
        </Link>
      ) : (
        <button
          type="button"
          disabled={!canOpenTradeModal}
          onClick={openModal}
          className="flex min-h-[48px] touch-manipulation items-center justify-center gap-2 rounded-lg bg-[var(--md-primary)] py-2.5 text-[13px] font-bold text-white shadow-[0_4px_14px_rgb(59_130_246_/_0.35)] transition active:scale-[0.98] enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0"
        >
          <Zap className="h-4 w-4" />
          Trade {outcome}
          <ChevronRight className="h-4 w-4 opacity-80" />
        </button>
      )}
      {!compact ? (
        <p className="text-center text-[9px] leading-snug text-zinc-600">
          {isConnected
            ? "On-chain execution via MetaMask · BNB Chain"
            : "Connect wallet on the Wallet page to trade on-chain."}
        </p>
      ) : null}
    </div>
  );
}

export const MarketTradingDesk = memo(MarketTradingDeskInner);
