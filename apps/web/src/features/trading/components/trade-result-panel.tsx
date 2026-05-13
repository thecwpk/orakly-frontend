"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Repeat2,
  X,
} from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import type { TradeExecutionSnapshotDto } from "@/shared/api/fetchers/execute-trade";
import { ROUTES } from "@/shared/constants/routes";
import {
  formatCents,
  formatShares,
  formatUsd,
  parseFloatSafe,
} from "../lib/trade-math";
import type { TradeModalMarket } from "../store/use-trade-modal-store";
import type { TradeDraft } from "./trade-compose-panel";
import { cn } from "@/lib/utils";

function Cell({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: "primary" | "success" | "danger";
}) {
  const cls =
    emphasis === "success"
      ? "text-emerald-200"
      : emphasis === "primary"
        ? "text-cyan-100"
        : emphasis === "danger"
          ? "text-rose-200"
          : "text-zinc-100";
  return (
    <div className="rounded-xl bg-black/30 px-3 py-2.5 ring-1 ring-white/[0.06]">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-mono text-[13px] font-semibold tabular-nums",
          cls,
        )}
      >
        {value}
      </p>
    </div>
  );
}

function TradeResultPanelInner({
  market,
  draft,
  result,
  error,
  onRetry,
  onTradeAgain,
  onClose,
}: {
  market: TradeModalMarket;
  draft: TradeDraft;
  result: TradeExecutionSnapshotDto | null;
  error: string | null;
  onRetry: () => void;
  onTradeAgain: () => void;
  onClose: () => void;
}) {
  const isError = !!error;
  const isYes = draft.outcome === "YES";

  if (isError) {
    return (
      <div className="flex flex-col gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-transparent p-5 text-center ring-1 ring-rose-400/30"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20 ring-1 ring-rose-400/40">
            <AlertTriangle className="h-5 w-5 text-rose-200" />
          </div>
          <p className="mt-3 text-base font-semibold tracking-tight text-white">
            Trade failed
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-rose-100/80">
            {error}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-xl bg-white/[0.04] text-[13px] font-semibold text-zinc-300 ring-1 ring-white/[0.08] transition hover:bg-white/[0.08] hover:text-white"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-violet-500 text-[13px] font-bold text-white ring-1 ring-rose-300/30 transition hover:brightness-110"
          >
            <Repeat2 className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ─── Success
  const px = parseFloatSafe(result?.executedPrice ?? null) ?? draft.usd / draft.shares;
  const qty = parseFloatSafe(result?.quantity ?? null) ?? draft.shares;
  const notional = parseFloatSafe(result?.notionalUsd ?? null) ?? draft.usd;
  const fee = parseFloatSafe(result?.feeUsd ?? null) ?? 0;
  const newBalance = parseFloatSafe(result?.walletAvailableUsd ?? null);
  const newYes = parseFloatSafe(result?.odds?.yesPrice ?? null);

  return (
    <div className="flex flex-col gap-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className={cn(
          "relative overflow-hidden rounded-2xl p-5 text-center ring-1",
          isYes
            ? "bg-gradient-to-br from-cyan-500/15 via-emerald-500/8 to-transparent ring-cyan-400/30"
            : "bg-gradient-to-br from-rose-500/15 via-violet-500/8 to-transparent ring-rose-400/30",
        )}
      >
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl",
            isYes ? "bg-cyan-500/30" : "bg-rose-500/30",
          )}
        />
        <motion.div
          initial={{ scale: 0.6, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 320,
            damping: 18,
            delay: 0.05,
          }}
          className={cn(
            "mx-auto flex h-12 w-12 items-center justify-center rounded-full ring-1",
            isYes
              ? "bg-emerald-500/20 ring-emerald-400/40"
              : "bg-violet-500/20 ring-violet-400/40",
          )}
        >
          <CheckCircle2
            className={cn(
              "h-6 w-6",
              isYes ? "text-emerald-200" : "text-violet-200",
            )}
          />
        </motion.div>
        <p className="mt-3 text-base font-semibold tracking-tight text-white">
          Trade executed
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-zinc-300">
          {draft.direction === "BUY" ? "Bought" : "Sold"}{" "}
          <span className="font-mono">{formatShares(qty)}</span>{" "}
          <span className={isYes ? "text-cyan-200" : "text-rose-200"}>
            {draft.outcome}
          </span>{" "}
          @ <span className="font-mono">{formatCents(px)}</span>
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Cell label="Quantity" value={`${formatShares(qty)} ${draft.outcome}`} />
        <Cell label="Avg price" value={formatCents(px)} emphasis="primary" />
        <Cell label="Fill notional" value={formatUsd(notional)} />
        <Cell label="Fee" value={formatUsd(fee)} />
        <Cell
          label="New YES px"
          value={newYes != null ? formatCents(newYes) : "—"}
          emphasis="primary"
        />
        <Cell
          label="Wallet"
          value={newBalance != null ? formatUsd(newBalance) : "—"}
          emphasis="success"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-white/[0.04] text-[12.5px] font-semibold text-zinc-300 ring-1 ring-white/[0.08] transition hover:bg-white/[0.08] hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
          Done
        </button>
        <Link
          href={ROUTES.portfolio}
          onClick={onClose}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-white/[0.04] text-[12.5px] font-semibold text-zinc-200 ring-1 ring-white/[0.08] transition hover:bg-white/[0.08] hover:text-white"
        >
          Portfolio
          <ArrowUpRight className="h-3.5 w-3.5 opacity-80" />
        </Link>
        <button
          type="button"
          onClick={onTradeAgain}
          className={cn(
            "inline-flex h-11 items-center justify-center gap-1.5 rounded-xl text-[12.5px] font-bold ring-1 transition hover:brightness-110",
            isYes
              ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-zinc-950 ring-cyan-300/40"
              : "bg-gradient-to-r from-rose-500 to-violet-500 text-white ring-rose-300/40",
          )}
        >
          <Repeat2 className="h-3.5 w-3.5" />
          Trade more
        </button>
      </div>

      <p className="text-center font-mono text-[10px] text-zinc-600">
        Tx ref{" "}
        <span className="text-zinc-400">
          {result?.tradeId ? result.tradeId.slice(0, 14) + "…" : "pending"}
        </span>{" "}
        · Market <span className="text-zinc-400">{market.slug}</span>
      </p>
    </div>
  );
}

export const TradeResultPanel = memo(TradeResultPanelInner);
