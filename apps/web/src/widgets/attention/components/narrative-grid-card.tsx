"use client";

import { formatCompactUsd } from "@orakly/utils";
import { cn } from "@/lib/utils";
import type { AttentionMomentum } from "@/shared/contracts/attention-dashboard";

export type NarrativeGridCardModel = {
  name: string;
  slug: string;
  emoji?: string;
  attentionScore: number;
  convictionScore: number;
  activeMarkets: number;
  volume24hUsd: number;
  momentum: AttentionMomentum;
  momentumPct?: number;
  empty?: boolean;
};

function scoreTone(score: number): { text: string; bar: string } {
  if (score < 34) return { text: "text-rose-400", bar: "bg-rose-500" };
  if (score < 67) return { text: "text-amber-400", bar: "bg-amber-500" };
  return { text: "text-emerald-400", bar: "bg-emerald-500" };
}

function formatMomentumPct(pct: number): string {
  if (!Number.isFinite(pct) || Math.abs(pct) < 0.05) return "0%";
  const rounded = Math.round(pct);
  return rounded > 0 ? `+${rounded}%` : `${rounded}%`;
}

export function NarrativeGridCard({
  card,
  onClick,
  className,
}: {
  card: NarrativeGridCardModel;
  onClick?: () => void;
  className?: string;
}) {
  const tone = scoreTone(card.attentionScore);
  const empty = Boolean(card.empty);
  const barPct = Math.max(0, Math.min(100, card.attentionScore));
  const pct = card.momentumPct ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border p-5 text-left transition duration-200",
        "cursor-pointer hover:scale-105 hover:shadow-lg",
        empty
          ? "border-[var(--border)] bg-[var(--background-secondary)]"
          : "border-[var(--border)] bg-[var(--background-secondary)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={cn(
            "text-[18px] font-bold tracking-tight",
            empty ? "text-[var(--foreground-muted)]" : "text-[var(--foreground)]",
          )}
        >
          {card.name}
        </h3>
        {card.emoji ? (
          <span className="text-[20px] leading-none" aria-hidden>
            {card.emoji}
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        <p className="text-[11px] text-[var(--foreground-muted)]">Attention</p>
        <p
          className={cn(
            "text-[48px] font-bold leading-none tracking-tight",
            empty ? "text-[var(--foreground-muted)]" : tone.text,
          )}
        >
          {Math.round(card.attentionScore)}
        </p>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)]">
          <div
            className={cn("h-full rounded-full", empty ? "bg-[var(--foreground-muted)]" : tone.bar)}
            style={{ width: `${barPct}%` }}
          />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[11px] text-[var(--foreground-muted)]">Conviction</p>
        <p
          className={cn(
            "text-[24px] font-bold tabular-nums",
            empty ? "text-[var(--foreground-muted)]" : "text-[var(--foreground)]",
          )}
        >
          {Math.round(card.convictionScore)}
        </p>
      </div>

      <div
        className={cn(
          "mt-3 flex justify-between text-[12px]",
          empty ? "text-[var(--foreground-muted)]" : "text-[var(--foreground-muted)]",
        )}
      >
        <span>Markets: {card.activeMarkets}</span>
        <span>Volume: {formatCompactUsd(card.volume24hUsd)}</span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span
          className={cn(
            "rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1",
            empty && "bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] text-[var(--foreground-muted)] ring-[var(--border)]",
            !empty &&
              card.momentum === "Growing" &&
              "bg-emerald-500/15 text-emerald-300 ring-emerald-400/25",
            !empty &&
              card.momentum === "Cooling" &&
              "bg-rose-500/15 text-rose-300 ring-rose-400/25",
            !empty &&
              card.momentum === "Stable" &&
              "bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] text-[var(--foreground-muted)] ring-[var(--border)]",
          )}
        >
          {card.momentum === "Growing"
            ? "Growing ↑"
            : card.momentum === "Cooling"
              ? "Cooling ↓"
              : "Stable →"}
        </span>
        <span
          className={cn(
            "text-[12px] font-semibold tabular-nums",
            empty && "text-[var(--foreground-muted)]",
            !empty && pct > 0 && "text-emerald-400",
            !empty && pct < 0 && "text-rose-400",
            !empty && pct === 0 && "text-[var(--foreground-muted)]",
          )}
        >
          {formatMomentumPct(pct)}
        </span>
      </div>
    </button>
  );
}
