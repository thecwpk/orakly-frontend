"use client";

import { formatCompactUsd } from "@orakly/utils";
import { motion } from "framer-motion";
import { memo } from "react";
import { cn } from "@/lib/utils";

function PnlSummaryInner({
  realizedUsd,
  unrealizedUsd,
  dense = false,
}: {
  realizedUsd: number;
  unrealizedUsd: number;
  /** Single-row analytics strip for terminal bottoms. */
  dense?: boolean;
}) {
  const total = realizedUsd + unrealizedUsd;
  const items = [
    { label: "Realized", value: realizedUsd, hint: "Settled" },
    { label: "Unrealized", value: unrealizedUsd, hint: "MTM" },
    { label: "Combined", value: total, hint: "Total" },
  ] as const;

  if (dense) {
    return (
      <div className="rounded-lg border border-white/[0.07] bg-[#07070d]/95 px-3 py-2 ring-1 ring-white/[0.04]">
        <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
          P&amp;L analytics
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2 divide-x divide-white/[0.06]">
          {items.map((item) => {
            const pos = item.value >= 0;
            return (
              <div key={item.label} className="min-w-0 px-2 first:pl-0 last:pr-0">
                <p className="text-[8px] font-semibold uppercase tracking-wide text-zinc-600">{item.label}</p>
                <p
                  className={cn(
                    "mt-0.5 font-mono text-[13px] font-semibold tabular-nums leading-none",
                    pos ? "text-emerald-300/95" : "text-rose-300/95",
                  )}
                >
                  {item.value === 0 ? formatCompactUsd(0) : `${pos ? "+" : ""}${formatCompactUsd(item.value)}`}
                </p>
                <p className="mt-1 font-mono text-[8.5px] text-zinc-600">{item.hint}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item, i) => {
        const pos = item.value >= 0;
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel rounded-xl px-3 py-2.5 ring-1 ring-white/7"
          >
            <p className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">{item.label}</p>
            <p
              className={cn(
                "mt-1 font-mono text-lg font-semibold tabular-nums sm:text-xl",
                pos ? "text-emerald-300" : "text-rose-300",
              )}
            >
              {item.value === 0 ? formatCompactUsd(0) : `${pos ? "+" : ""}${formatCompactUsd(item.value)}`}
            </p>
            <p className="mt-1 text-[11px] text-zinc-600">{item.hint}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

export const PnlSummary = memo(PnlSummaryInner);
