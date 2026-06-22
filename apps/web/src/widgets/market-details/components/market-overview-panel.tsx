"use client";

import type { Market } from "@orakly/types";
import { memo, useMemo } from "react";
import type { MarketOddsDto } from "@/shared/api/fetchers/markets-live";
import type { MarketRealtimeSnapshot } from "@/websocket/store/market-realtime-store";
import { ROUTES } from "@/shared/constants/routes";
import { PrefetchLink } from "@/shared/ui";
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
  slug,
  disabled,
}: {
  side: "YES" | "NO";
  cents: number;
  label: string;
  slug: string;
  disabled: boolean;
}) {
  const isYes = side === "YES";
  const href = `${ROUTES.market(slug)}?side=${side}`;
  const shell = cn(
    "flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border px-3 py-2.5 transition",
    isYes
      ? "border-[var(--md-success)]/30 bg-[var(--md-success-bg)]"
      : "border-[var(--md-danger)]/30 bg-[var(--md-danger-bg)]",
    disabled && "pointer-events-none opacity-60",
  );

  const inner = (
    <>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--md-muted)]">
          {side}
        </p>
        <p className="text-[10px] text-[var(--md-muted)]">
          {isYes ? "Event happens" : "Event does not"}
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

  if (disabled) return <div className={shell}>{inner}</div>;
  return (
    <PrefetchLink href={href} className={cn(shell, "hover:bg-white/[0.03]")}>
      {inner}
    </PrefetchLink>
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
}: {
  market: Market;
  midYes: number;
  midNo: number;
  yesLabel: string;
  noLabel: string;
  odds: MarketOddsDto | undefined;
  rt: MarketRealtimeSnapshot;
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
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] leading-snug text-[var(--md-muted)]">
          <span className="font-semibold text-[var(--md-success)]">Yes</span> = happens ·{" "}
          <span className="font-semibold text-[var(--md-danger)]">No</span> = does not, before
          close.
        </p>
        <span
          className={cn(
            "shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold ring-1",
            isOpen
              ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/22"
              : "bg-zinc-500/12 text-zinc-400 ring-white/8",
          )}
        >
          {market.status}
        </span>
      </div>

      <div className="mt-2.5 flex gap-2">
        <OutcomeCard
          side="YES"
          cents={yesCents}
          label={yesLabel}
          slug={market.slug}
          disabled={!isOpen}
        />
        <OutcomeCard
          side="NO"
          cents={noCents}
          label={noLabel}
          slug={market.slug}
          disabled={!isOpen}
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
