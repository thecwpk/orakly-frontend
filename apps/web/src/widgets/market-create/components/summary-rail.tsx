"use client";

import { formatCompactUsd } from "@orakly/utils";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { findCategory } from "@/features/markets/lib/categories";
import { useCreateMarketStore } from "@/features/markets/store/use-create-market-store";
import { cn } from "@/lib/utils";

function relTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
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
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          Draft summary
        </p>
        <span
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
            isReady
              ? "bg-emerald-500/10 text-emerald-300 ring-emerald-400/30"
              : "bg-white/[0.05] text-zinc-400 ring-white/10",
          )}
        >
          <Sparkles className="h-2.5 w-2.5" />
          {isReady ? "Ready" : `${completePct}%`}
        </span>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-400"
          initial={false}
          animate={{ width: `${completePct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      <div className="space-y-1">
        <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-white">
          {draft.title || (
            <span className="text-zinc-600">Your market title…</span>
          )}
        </p>
        <p className="font-mono text-[10px] text-zinc-600">
          /markets/{draft.slug || "—"}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-2">
        <SummaryStat label="Category" value={cat?.name ?? "—"} />
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

      <div className="rounded-lg bg-black/30 p-2.5 ring-1 ring-white/[0.06]">
        <div className="flex items-center justify-between text-[10px] text-zinc-500">
          <span>Initial YES</span>
          <span className="font-mono text-cyan-300">{yesPct}%</span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-zinc-800/80">
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
    <div className="rounded-lg bg-black/20 px-2.5 py-1.5 ring-1 ring-white/[0.06]">
      <dt className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 truncate text-[12px] text-zinc-200",
          mono && "font-mono",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
