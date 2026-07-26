"use client";

import { formatCompactUsd } from "@orakly/utils";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { findCategory } from "@/features/markets/lib/categories";
import type { CreateMarketDraft } from "@/features/markets/store/use-create-market-store";
import { cn } from "@/lib/utils";

export function PreviewCard({ draft }: { draft: CreateMarketDraft }) {
  const cat = findCategory(draft.category);
  const yesPct = Math.round(draft.initialProbability * 100);

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "glass-panel-strong neon-edge-cyan group relative overflow-hidden rounded-xl p-4",
      )}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-cyan-500/20 to-transparent opacity-70 blur-xl" />

      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[color-mix(in_srgb,var(--foreground)_8%,transparent)] to-[color-mix(in_srgb,var(--foreground)_2%,transparent)] ring-1 ring-[var(--border)]">
          {cat ? (
            <cat.icon className="h-5 w-5 text-cyan-400/90" />
          ) : (
            <TrendingUp className="h-5 w-5 text-cyan-400/90" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[color-mix(in_srgb,var(--foreground)_7%,transparent)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--foreground)]/80 ring-1 ring-[var(--border)]">
              {cat?.name ?? "N/A"}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-emerald-300/80">
              Pending review
            </span>
          </div>
          <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-[var(--foreground)]">
            {draft.title || "Your market title appears here"}
          </h3>
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--foreground-muted)]">
            <span>
              Vol{" "}
              <span className="font-medium text-[var(--foreground)]/80">$0</span>
            </span>
            <span>
              Liq{" "}
              <span className="font-medium text-[var(--foreground)]/80">
                {formatCompactUsd(draft.liquiditySeedUsd)}
              </span>
            </span>
            <span>
              Fee{" "}
              <span className="font-medium text-[var(--foreground)]/80">
                {(draft.takerFeeBps / 100).toFixed(2)}%
              </span>
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] text-[var(--foreground-muted)]">
              <span>YES</span>
              <span className="font-mono text-cyan-300/90">{yesPct}%</span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]">
              <motion.div
                key={yesPct}
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: `${yesPct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
