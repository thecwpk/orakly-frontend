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

const ROW_LABEL = "text-[11px] font-medium uppercase tracking-wider text-[var(--foreground-muted)]";
const ROW_VALUE = "text-[12px] tabular-nums text-[var(--foreground)]";

export function StepPreview() {
  const draft = useCreateMarketStore((s) => s.draft);
  const cat = findCategory(draft.category);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
          Market preview
        </p>
        <p className="mt-1 text-[12px] text-[var(--foreground-muted)]">
          This is exactly how your market will appear in the discovery grid.
        </p>
        <div className="mt-3">
          <PreviewCard draft={draft} />
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]">
        <dl className="divide-y divide-[var(--border)]">
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
                  mono ? `${ROW_VALUE} truncate font-mono text-[var(--foreground)]/80` : ROW_VALUE
                }
              >
                {value as string}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {draft.description ? (
        <div className="rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
            Context
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--foreground)]/80">
            {draft.description}
          </p>
        </div>
      ) : null}
    </div>
  );
}
