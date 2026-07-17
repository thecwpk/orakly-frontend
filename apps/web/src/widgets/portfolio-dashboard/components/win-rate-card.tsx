"use client";

import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { memo } from "react";

function WinRateCardInner({
  winRatePct,
  closedQty,
}: {
  winRatePct: number | null;
  closedQty: number;
}) {
  const pct = winRatePct != null ? Math.round(winRatePct * 10) / 10 : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="glass-panel-strong relative overflow-hidden rounded-2xl p-5 ring-1 ring-[var(--hub-border)]"
    >
      <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="relative flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/25">
          <Target className="h-6 w-6 text-emerald-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--hub-muted)]">Win rate</p>
          <p className="mt-1 text-[13px] leading-snug text-[var(--hub-muted)]">
            FIFO-matched sells vs entry; requires enough trade history.
          </p>
          <p className="mt-4 font-mono text-4xl font-semibold tracking-tight text-[var(--hub-fg)]">
            {pct != null ? `${pct}%` : "N/A"}
          </p>
          <p className="mt-2 font-mono text-[11px] text-[var(--hub-muted)]">
            {closedQty > 0 ? `${closedQty.toLocaleString()} contracts closed (matched)` : "No matched exits yet"}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export const WinRateCard = memo(WinRateCardInner);
