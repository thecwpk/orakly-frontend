"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { compactUsd, signedCompactUsd } from "../lib/format";

export type ProfileHeaderStatsProps = {
  winRatePct: number;
  totalPnlUsd: number;
  totalVolumeUsd: number;
  openPositions: number;
  rank: number;
  className?: string;
};

function ProfileHeaderStatsInner({
  winRatePct,
  totalPnlUsd,
  totalVolumeUsd,
  openPositions,
  rank,
  className,
}: ProfileHeaderStatsProps) {
  const items = [
    { label: "Win Rate", value: `${winRatePct.toFixed(1)}%` },
    {
      label: "Total PnL",
      value: signedCompactUsd(totalPnlUsd),
      tone: totalPnlUsd >= 0 ? "positive" : "negative",
    },
    { label: "Total Volume", value: compactUsd(totalVolumeUsd) },
    { label: "Open Positions", value: String(openPositions) },
    { label: "Global Rank", value: `#${rank}` },
  ] as const;

  return (
    <section
      aria-label="Profile statistics"
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5",
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-[var(--hub-border)] bg-[var(--hub-card)] px-3 py-3 ring-1 ring-[var(--hub-border)]"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--hub-muted)]">
            {item.label}
          </p>
          <p
            className={cn(
              "mt-1 font-mono text-lg font-semibold tabular-nums text-[var(--hub-fg)]",
              "tone" in item && item.tone === "positive" && "text-emerald-300",
              "tone" in item && item.tone === "negative" && "text-rose-300",
            )}
          >
            {item.value}
          </p>
        </div>
      ))}
    </section>
  );
}

export const ProfileHeaderStats = memo(ProfileHeaderStatsInner);
