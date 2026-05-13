"use client";

import { formatCompactUsd } from "@orakly/utils";
import type { ReactNode } from "react";
import { memo } from "react";
import { cn } from "@/lib/utils";

function Metric({
  label,
  value,
  sub,
  valueClassName,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  valueClassName?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative min-w-[8.5rem] flex-1 px-3 py-2 sm:min-w-0 sm:px-4 sm:py-2.5",
        "border-b border-white/[0.06] sm:border-b-0 sm:border-r sm:border-white/[0.06] last:border-r-0",
        className,
      )}
    >
      <p className="label-terminal">{label}</p>
      <div className={cn("mt-1 font-mono text-[15px] font-semibold tabular-nums leading-none text-zinc-50 sm:text-base", valueClassName)}>
        {value}
      </div>
      {sub ? (
        <div className="mt-1 text-[9px] leading-snug text-zinc-600">{sub}</div>
      ) : null}
    </div>
  );
}

function PortfolioTerminalSummaryInner({
  equityUsd,
  realizedUsd,
  unrealizedUsd,
  winRatePct,
  exposurePctOfEquity,
  exposureNotionalUsd,
  positionCount,
  availableUsd,
  lockedUsd,
}: {
  equityUsd: number;
  realizedUsd: number;
  unrealizedUsd: number;
  winRatePct: number | null;
  exposurePctOfEquity: number;
  exposureNotionalUsd: number;
  positionCount: number;
  availableUsd: number;
  lockedUsd: number;
}) {
  const totalPnl = realizedUsd + unrealizedUsd;
  const pnlPos = totalPnl >= 0;

  return (
    <div className="surface-terminal-solid overflow-hidden rounded-md">
      <div className="border-b border-white/[0.06] px-r16 py-r16 sm:px-r24">
        <p className="label-terminal tracking-[0.16em]">Book summary</p>
        <p className="mt-r4 font-mono text-[10px] tabular-nums text-zinc-600">
          Marks · venue mid · FIFO win rate
        </p>
      </div>

      <div className="flex flex-col divide-y divide-white/[0.06] sm:flex-row sm:divide-x sm:divide-y-0">
        <Metric
          label="Portfolio value"
          value={formatCompactUsd(equityUsd)}
          sub={
            <>
              <span className="font-mono text-zinc-500">Avail {formatCompactUsd(availableUsd)}</span>
              {" · "}
              <span className="font-mono text-zinc-500">Lock {formatCompactUsd(lockedUsd)}</span>
            </>
          }
          className="sm:flex-[1.35]"
        />
        <Metric
          label="P&amp;L"
          value={
            totalPnl === 0 ?
              formatCompactUsd(0)
            : `${pnlPos ? "+" : "−"}${formatCompactUsd(Math.abs(totalPnl))}`
          }
          sub={
            <>
              <span className="font-mono text-emerald-400/90">R {realizedUsd >= 0 ? "+" : ""}{formatCompactUsd(realizedUsd)}</span>
              {" · "}
              <span className={cn("font-mono", unrealizedUsd >= 0 ? "text-cyan-400/85" : "text-rose-400/85")}>
                U {unrealizedUsd >= 0 ? "+" : ""}{formatCompactUsd(unrealizedUsd)}
              </span>
            </>
          }
          valueClassName={pnlPos ? "text-emerald-400/95" : "text-rose-400/95"}
        />
        <Metric
          label="Win rate"
          value={winRatePct != null ? `${Math.round(winRatePct * 10) / 10}%` : "—"}
          sub="Closed sells · FIFO"
          className="sm:max-w-[9rem]"
        />
        <Metric
          label="Exposure"
          value={`${exposurePctOfEquity.toFixed(1)}%`}
          sub={<span className="font-mono text-zinc-500">{formatCompactUsd(exposureNotionalUsd)} book</span>}
          className="sm:max-w-[9rem]"
        />
        <Metric
          label="Positions"
          value={String(positionCount)}
          sub="Active legs"
          className="border-r-0 sm:max-w-[7.5rem]"
        />
      </div>
    </div>
  );
}

export const PortfolioTerminalSummary = memo(PortfolioTerminalSummaryInner);
