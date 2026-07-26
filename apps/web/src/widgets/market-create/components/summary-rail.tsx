"use client";

import { formatCompactUsd } from "@orakly/utils";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { findCategory } from "@/features/markets/lib/categories";
import { useCreateMarketStore } from "@/features/markets/store/use-create-market-store";
import { cn } from "@/lib/utils";

function relTime(iso: string): string {
  if (!iso) return "N/A";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "N/A";
  const diffMs = d.getTime() - Date.now();
  const hours = Math.round(diffMs / 3600_000);
  if (Math.abs(hours) < 48) return `${hours >= 0 ? "in" : ""} ${Math.abs(hours)}h`;
  const days = Math.round(hours / 24);
  return `${days >= 0 ? "in" : ""} ${Math.abs(days)}d`;
}

export function SummaryRail({
  completePct,
  isReady,
}: {
  completePct: number;
  isReady: boolean;
}) {
  const draft = useCreateMarketStore((s) => s.draft);
  const cat = findCategory(draft.category);
  const yesPct = Math.round(draft.initialProbability * 100);

  return (
    <aside className="glass-panel-strong sticky top-[5.5rem] space-y-4 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
          Draft summary
        </p>
        <span
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
            isReady
              ? "bg-emerald-500/10 text-emerald-300 ring-emerald-400/30"
              : "bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] text-[var(--foreground-muted)] ring-[var(--border)]",
          )}
        >
          <Sparkles className="h-2.5 w-2.5" />
          {isReady ? "Ready" : `${completePct}%`}
        </span>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-400"
          initial={false}
          animate={{ width: `${completePct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      <div className="space-y-1">
        <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-[var(--foreground)]">
          {draft.title || (
            <span className="text-[var(--foreground-muted)]">Your market title…</span>
          )}
        </p>
        <p className="font-mono text-[10px] text-[var(--foreground-muted)]">
          /markets/{draft.slug || "your-slug"}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-2">
        <SummaryStat label="Category" value={cat?.name ?? "N/A"} />
        <SummaryStat label="Source" value={draft.source.toLowerCase()} mono />
        <SummaryStat
          label="Liquidity"
          value={formatCompactUsd(draft.liquiditySeedUsd)}
        />
        <SummaryStat
          label="Fee"
          value={`${(draft.takerFeeBps / 100).toFixed(2)}%`}
        />
        <SummaryStat label="Opens" value={relTime(draft.opensAt)} />
        <SummaryStat label="Closes" value={relTime(draft.closesAt)} />
      </dl>

      <div className="rounded-lg bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] p-2.5 ring-1 ring-[var(--border)]">
        <div className="flex items-center justify-between text-[10px] text-[var(--foreground-muted)]">
          <span>Initial YES</span>
          <span className="font-mono text-cyan-300">{yesPct}%</span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]">
          <motion.div
            initial={false}
            animate={{ width: `${yesPct}%` }}
            transition={{ duration: 0.45 }}
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400"
          />
        </div>
      </div>
    </aside>
  );
}

function SummaryStat({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] px-2.5 py-1.5 ring-1 ring-[var(--border)]">
      <dt className="text-[9px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 truncate text-[12px] text-[var(--foreground)]",
          mono && "font-mono",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
