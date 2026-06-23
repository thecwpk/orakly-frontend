"use client";

import type { Market } from "@orakly/types";
import { memo, useMemo } from "react";
import type { MarketOddsDto } from "@/shared/api/fetchers/markets-live";
import type { MarketRealtimeSnapshot } from "@/websocket/store/market-realtime-store";
import { cn } from "@/lib/utils";
import { buildMarketDetailStatCells } from "./market-stats-strip";
import { marketDetailPanelClass } from "./market-detail-section";

function formatClosesAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OutcomeCard({
  side,
  cents,
  label,
  selected,
  disabled,
  onSelect,
}: {
  side: "YES" | "NO";
  cents: number;
  label: string;
  selected: boolean;
  disabled: boolean;
  onSelect: (side: "YES" | "NO") => void;
}) {
  const isYes = side === "YES";
  const shell = cn(
    "flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition",
    isYes
      ? "border-[var(--md-success)]/30 bg-[var(--md-success-bg)]"
      : "border-[var(--md-danger)]/30 bg-[var(--md-danger-bg)]",
    selected &&
      (isYes
        ? "ring-2 ring-[var(--md-success)]/45"
        : "ring-2 ring-[var(--md-danger)]/45"),
    disabled && "pointer-events-none opacity-60",
    !disabled && "cursor-pointer hover:bg-white/[0.03]",
  );

  if (disabled) {
    return (
      <div className={shell}>
        <OutcomeCardBody side={side} cents={cents} label={label} />
      </div>
    );
  }

  return (
    <button type="button" className={shell} onClick={() => onSelect(side)} aria-pressed={selected}>
      <OutcomeCardBody side={side} cents={cents} label={label} />
    </button>
  );
}

function OutcomeCardBody({
  side,
  cents,
  label,
}: {
  side: "YES" | "NO";
  cents: number;
  label: string;
}) {
  const isYes = side === "YES";
  return (
    <>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--md-muted)]">
          {side}
        </p>
      </div>
      <div className="text-right">
        <p
          className={cn(
            "font-mono text-2xl font-bold tabular-nums leading-none",
            isYes ? "text-[var(--md-success)]" : "text-[var(--md-danger)]",
          )}
        >
          {cents}¢
        </p>
        <p className="mt-0.5 font-mono text-[10px] text-[var(--md-muted)]">{label}</p>
      </div>
    </>
  );
}

function MarketOverviewPanelInner({
  market,
  midYes,
  midNo,
  yesLabel,
  noLabel,
  odds,
  rt,
  selectedSide,
  onSelectSide,
}: {
  market: Market;
  midYes: number;
  midNo: number;
  yesLabel: string;
  noLabel: string;
  odds: MarketOddsDto | undefined;
  rt: MarketRealtimeSnapshot;
  selectedSide: "YES" | "NO";
  onSelectSide: (side: "YES" | "NO") => void;
}) {
  const yesCents = Math.round(midYes * 1000) / 10;
  const noCents = Math.round(midNo * 1000) / 10;
  const isOpen = market.status === "OPEN";
  const closesLabel = useMemo(() => formatClosesAt(market.closesAt), [market.closesAt]);

  const metricCells = useMemo(
    () => [...buildMarketDetailStatCells(market, odds, rt)],
    [market, odds, rt],
  );

  return (
    <section
      className={cn(marketDetailPanelClass, "p-3 sm:p-3.5")}
      aria-label="Market overview"
    >
      <div className="flex gap-2">
        <OutcomeCard
          side="YES"
          cents={yesCents}
          label={yesLabel}
          selected={selectedSide === "YES"}
          disabled={!isOpen}
          onSelect={onSelectSide}
        />
        <OutcomeCard
          side="NO"
          cents={noCents}
          label={noLabel}
          selected={selectedSide === "NO"}
          disabled={!isOpen}
          onSelect={onSelectSide}
        />
      </div>

      <dl className="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
        {metricCells.map((c) => (
          <div
            key={c.label}
            className="rounded-md bg-[color-mix(in_srgb,var(--md-bg-subtle)_70%,transparent)] px-2 py-1.5 ring-1 ring-[var(--md-border)]"
          >
            <dt className="text-[9px] font-semibold uppercase tracking-wide text-[var(--md-muted)]">
              {c.label}
            </dt>
            <dd
              className={cn(
                "mt-0.5 text-[12px] font-medium text-[var(--md-fg)]",
                c.mono && "font-mono tabular-nums",
              )}
            >
              {c.value}
            </dd>
          </div>
        ))}
        <div className="rounded-md bg-[color-mix(in_srgb,var(--md-bg-subtle)_70%,transparent)] px-2 py-1.5 ring-1 ring-[var(--md-border)]">
          <dt className="text-[9px] font-semibold uppercase tracking-wide text-[var(--md-muted)]">
            Closes
          </dt>
          <dd className="mt-0.5 text-[11px] font-medium leading-snug text-[var(--md-fg)]">
            {closesLabel}
          </dd>
        </div>
      </dl>
    </section>
  );
}

export const MarketOverviewPanel = memo(MarketOverviewPanelInner);
