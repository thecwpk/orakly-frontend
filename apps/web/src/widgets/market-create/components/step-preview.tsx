"use client";

import { formatCompactUsd } from "@orakly/utils";
import { useCreateMarketStore } from "@/features/markets/store/use-create-market-store";
import { findCategory } from "@/features/markets/lib/categories";
import { PreviewCard } from "./preview-card";

function formatDateTime(iso: string): string {
  if (!iso) return "N/A";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const ROW_LABEL = "text-[11px] font-medium uppercase tracking-wider text-zinc-500";
const ROW_VALUE = "text-[12px] tabular-nums text-zinc-200";

export function StepPreview() {
  const draft = useCreateMarketStore((s) => s.draft);
  const cat = findCategory(draft.category);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
          Market preview
        </p>
        <p className="mt-1 text-[12px] text-zinc-500">
          This is exactly how your market will appear in the discovery grid.
        </p>
        <div className="mt-3">
          <PreviewCard draft={draft} />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20">
        <dl className="divide-y divide-white/[0.06]">
          {[
            ["Slug", `/markets/${draft.slug || "your-slug"}`, true],
            ["Category", cat?.name ?? draft.category, false],
            ["Resolution", draft.source.toLowerCase(), false],
            ["Source URL", draft.sourceUrl || "Not set", true],
            ["Opens", formatDateTime(draft.opensAt), false],
            ["Closes", formatDateTime(draft.closesAt), false],
            ["Liquidity seed", formatCompactUsd(draft.liquiditySeedUsd), false],
            ["Initial probability", `${Math.round(draft.initialProbability * 100)}%`, false],
            ["Taker fee", `${(draft.takerFeeBps / 100).toFixed(2)}%`, false],
          ].map(([label, value, mono]) => (
            <div
              key={label as string}
              className="flex items-center justify-between gap-4 px-3.5 py-2"
            >
              <dt className={ROW_LABEL}>{label}</dt>
              <dd
                className={
                  mono ? `${ROW_VALUE} truncate font-mono text-zinc-300` : ROW_VALUE
                }
              >
                {value as string}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {draft.description ? (
        <div className="rounded-xl border border-white/10 bg-black/20 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Context
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-300">
            {draft.description}
          </p>
        </div>
      ) : null}
    </div>
  );
}
