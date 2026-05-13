"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Loader2, ShieldCheck, Zap } from "lucide-react";
import { memo } from "react";
import {
  formatCents,
  formatPct,
  formatShares,
  formatUsd,
  summarizePayout,
  type EnrichedQuote,
} from "../lib/trade-math";
import type { TradeModalMarket } from "../store/use-trade-modal-store";
import type { TradeDraft } from "./trade-compose-panel";
import { cn } from "@/lib/utils";

function Row({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: "primary" | "danger" | "success";
}) {
  const cls =
    emphasis === "primary"
      ? "text-cyan-100"
      : emphasis === "success"
        ? "text-emerald-200"
        : emphasis === "danger"
          ? "text-rose-200"
          : "text-zinc-100";
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-[12px]">
      <span className="text-[11px] uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <span className={cn("font-mono text-[13px] font-semibold tabular-nums", cls)}>
        {value}
      </span>
    </div>
  );
}

function TradeConfirmPanelInner({
  market,
  draft,
  quote,
  isSubmitting,
  midYesAtCompose,
  canExecuteTrade,
  onBack,
  onConfirm,
}: {
  market: TradeModalMarket;
  draft: TradeDraft;
  quote: EnrichedQuote;
  isSubmitting: boolean;
  /** Mid YES probability captured at the moment compose was submitted —
   *  we compare against the live mid to surface a slippage warning. */
  midYesAtCompose: number;
  /** Wallet connected + SIWE (or env demo actor). */
  canExecuteTrade: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const payout = summarizePayout(quote);
  const isYes = draft.outcome === "YES";
  const isBuy = draft.direction === "BUY";

  // Slippage relative to compose-time mid.
  const composedExec =
    isYes ? midYesAtCompose : 1 - midYesAtCompose;
  const slipBps =
    composedExec > 0
      ? Math.round(((quote.execPrice - composedExec) / composedExec) * 10_000)
      : 0;
  const slipWarn = Math.abs(slipBps) > 50;

  return (
    <div className="flex flex-col gap-4">
      {/* Big summary card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "relative overflow-hidden rounded-2xl p-4 ring-1",
          isYes
            ? "bg-gradient-to-br from-cyan-500/15 via-cyan-500/5 to-transparent ring-cyan-400/30"
            : "bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-transparent ring-rose-400/30",
        )}
      >
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl",
            isYes ? "bg-cyan-500/20" : "bg-rose-500/20",
          )}
        />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
          You are about to
        </p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
          <span
            className={cn(
              "rounded-md px-2 py-0.5 ring-1",
              isBuy
                ? "bg-emerald-500/15 text-emerald-100 ring-emerald-400/30"
                : "bg-rose-500/15 text-rose-100 ring-rose-400/30",
            )}
          >
            {draft.direction}
          </span>{" "}
          <span
            className={cn(
              "font-mono tabular-nums",
              isYes ? "text-cyan-100" : "text-rose-100",
            )}
          >
            {formatShares(quote.quantity)}
          </span>{" "}
          <span className="text-zinc-400">{draft.outcome}</span>
        </p>
        <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-zinc-300">
          {market.title}
        </p>
      </motion.div>

      {/* Line items */}
      <div className="divide-y divide-white/[0.05] rounded-xl bg-black/30 px-3.5 py-1 ring-1 ring-white/[0.06]">
        <Row
          label="Avg price"
          value={formatCents(quote.execPrice)}
        />
        <Row label="Quantity" value={`${formatShares(quote.quantity)} ${draft.outcome}`} />
        <Row label="Notional" value={formatUsd(quote.notionalUsd)} />
        <Row
          label={`Fee (${quote.takerFeeBps} bps)`}
          value={formatUsd(quote.feeUsd)}
        />
        <Row
          label={isBuy ? "Total cost" : "Net credit"}
          value={formatUsd(
            isBuy ? quote.totalDebitUsd : quote.netCreditUsd,
          )}
          emphasis="primary"
        />
      </div>

      {/* Outcome */}
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-emerald-500/[0.04] p-3 ring-1 ring-emerald-500/15">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
            Max payout
          </p>
          <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-emerald-200">
            {formatUsd(payout.maxPayoutUsd)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
            Max profit
          </p>
          <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-emerald-200">
            {formatUsd(payout.maxProfitUsd, { sign: true })}
          </p>
          <p className="font-mono text-[10px] tabular-nums text-emerald-300/70">
            {formatPct(payout.maxRoi, 0)} ROI
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
            Max loss
          </p>
          <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-rose-200">
            {formatUsd(-payout.maxLossUsd)}
          </p>
        </div>
      </div>

      {/* Slippage warning */}
      {slipWarn ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-[12px] text-amber-100 ring-1 ring-amber-400/25"
        >
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
          <span>
            Price moved <span className="font-mono">{slipBps > 0 ? "+" : ""}{slipBps} bps</span>{" "}
            since you composed this trade. Continue at the new fill price?
          </span>
        </motion.div>
      ) : (
        <div className="flex items-center gap-1.5 text-[10.5px] text-zinc-500">
          <ShieldCheck className="h-3 w-3 text-emerald-400/80" />
          Price within tolerance ({slipBps > 0 ? "+" : ""}
          {slipBps} bps)
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="inline-flex h-12 items-center gap-1.5 rounded-xl bg-white/[0.04] px-3.5 text-[13px] font-semibold text-zinc-300 ring-1 ring-white/[0.08] transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        {canExecuteTrade ? (
          <motion.button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            whileTap={{ scale: 0.99 }}
            animate={
              isSubmitting
                ? {
                    boxShadow: [
                      "0 0 0 0 rgba(34,211,238,0)",
                      "0 0 22px 2px rgba(34,211,238,0.35)",
                      "0 0 0 0 rgba(34,211,238,0)",
                    ],
                  }
                : { boxShadow: "0 0 0 0 transparent" }
            }
            transition={
              isSubmitting ?
                { duration: 1.15, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.2 }
            }
            className={cn(
              "relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-xl text-[13px] font-bold ring-1 transition",
              "disabled:cursor-not-allowed",
              isYes
                ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-zinc-950 ring-cyan-300/40 hover:brightness-110"
                : "bg-gradient-to-r from-rose-500 to-violet-500 text-white ring-rose-300/40 hover:brightness-110",
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5" />
                Confirm {draft.direction} {draft.outcome}
                <ChevronRight className="h-3.5 w-3.5 opacity-80" />
              </>
            )}
          </motion.button>
        ) : (
          <ConnectButton.Custom>
            {({
              mounted,
              account,
              authenticationStatus,
              openConnectModal,
              openAccountModal,
            }) => {
              if (!mounted) {
                return (
                  <div className="flex h-12 items-center justify-center rounded-xl bg-white/[0.04] text-[12px] text-zinc-500 ring-1 ring-white/[0.08]">
                    Loading…
                  </div>
                );
              }
              const connected = Boolean(account);
              const auth = authenticationStatus ?? "unauthenticated";
              const busy = auth === "loading";

              const onAuthClick = () => {
                if (!connected) openConnectModal();
                else if (auth !== "authenticated") openAccountModal();
                else openConnectModal();
              };

              const label =
                !connected ? "Connect wallet to trade"
                : auth !== "authenticated" ? "Sign in to trade"
                : "Connect wallet to trade";

              return (
                <motion.button
                  type="button"
                  onClick={onAuthClick}
                  disabled={busy}
                  whileTap={{ scale: busy ? 1 : 0.99 }}
                  className={cn(
                    "relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-[13px] font-bold ring-1 transition",
                    "bg-gradient-to-r from-cyan-500 to-emerald-500 text-zinc-950 ring-cyan-300/40 hover:brightness-110",
                    busy && "cursor-not-allowed opacity-60",
                  )}
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-3.5 w-3.5" />
                  )}
                  {label}
                  <ChevronRight className="h-3.5 w-3.5 opacity-80" />
                </motion.button>
              );
            }}
          </ConnectButton.Custom>
        )}
      </div>
    </div>
  );
}

export const TradeConfirmPanel = memo(TradeConfirmPanelInner);
