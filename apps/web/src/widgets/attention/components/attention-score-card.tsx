"use client";

import { cn } from "@/lib/utils";

export interface AttentionScoreCardProps {
  narrativeName: string;
  narrativeSlug: string;
  attentionScore: number;
  convictionScore: number;
  momentum: "Growing" | "Cooling" | "Stable";
  volume24hUsd: number;
  activeMarkets: number;
  uniqueTraders: number;
  liquidity: number;
  openInterest: number;
  onClick?: () => void;
  className?: string;
  /** Stretch gauges + chips across the full container width. */
  fullWidth?: boolean;
}

const GAUGE_CIRCUMFERENCE = 201;

const compactUsd = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const compactCount = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, Math.round(score)));
}

function scoreStrokeColor(score: number): string {
  if (score <= 33) return "#ef4444";
  if (score <= 66) return "#f59e0b";
  return "#22c55e";
}

function formatUsdCompact(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "$0";
  return `$${compactUsd.format(value)}`;
}

function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return compactCount.format(value);
}

const MOMENTUM_STYLES: Record<
  AttentionScoreCardProps["momentum"],
  { className: string; icon: string; label: string }
> = {
  Growing: {
    className: "bg-emerald-100 text-emerald-700",
    icon: "↑",
    label: "Growing",
  },
  Cooling: {
    className: "bg-red-100 text-red-700",
    icon: "↓",
    label: "Cooling",
  },
  Stable: {
    className: "bg-gray-100 text-gray-600",
    icon: "→",
    label: "Stable",
  },
};

type ScoreGaugeProps = {
  label: string;
  score: number;
};

function ScoreGauge({ label, score }: ScoreGaugeProps) {
  const value = clampScore(score);
  const dash = (value / 100) * GAUGE_CIRCUMFERENCE;
  const stroke = scoreStrokeColor(value);

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <div className="relative h-20 w-20">
        <svg
          viewBox="0 0 80 80"
          className="h-full w-full -rotate-90"
          aria-hidden
        >
          <circle
            cx="40"
            cy="40"
            r="32"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="40"
            cy="40"
            r="32"
            fill="none"
            stroke={stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${GAUGE_CIRCUMFERENCE}`}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-900"
          aria-label={`${label} ${value}`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

type StatChipProps = {
  label: string;
  value: string;
};

function StatChip({ label, value }: StatChipProps) {
  return (
    <div className="rounded-lg bg-gray-100 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export function AttentionScoreCard({
  narrativeName,
  narrativeSlug,
  attentionScore,
  convictionScore,
  momentum,
  volume24hUsd,
  activeMarkets,
  uniqueTraders,
  liquidity,
  openInterest,
  onClick,
  className,
  fullWidth,
}: AttentionScoreCardProps) {
  const momentumStyle = MOMENTUM_STYLES[momentum];

  return (
    <article
      data-narrative-slug={narrativeSlug}
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow",
        fullWidth && "w-full p-5 sm:p-6",
        onClick && "cursor-pointer hover:shadow-md",
        className,
      )}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <h3
          className={cn(
            "font-semibold text-gray-900",
            fullWidth ? "text-lg sm:text-xl" : "text-base",
          )}
        >
          {narrativeName}
        </h3>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
            momentumStyle.className,
          )}
        >
          <span aria-hidden>{momentumStyle.icon}</span>
          {momentumStyle.label}
        </span>
      </div>

      <div
        className={cn(
          "mt-4 flex items-center justify-around gap-4",
          fullWidth && "sm:justify-center sm:gap-16",
        )}
      >
        <ScoreGauge label="Attention" score={attentionScore} />
        <ScoreGauge label="Conviction" score={convictionScore} />
      </div>

      <div
        className={cn(
          "mt-4 flex flex-wrap gap-2",
          fullWidth && "sm:grid sm:grid-cols-5 sm:gap-3",
        )}
      >
        <StatChip label="Volume" value={formatUsdCompact(volume24hUsd)} />
        <StatChip label="Markets" value={String(activeMarkets)} />
        <StatChip label="Traders" value={String(uniqueTraders)} />
        <StatChip label="Liquidity" value={formatUsdCompact(liquidity)} />
        <StatChip label="Open Interest" value={formatUsdCompact(openInterest)} />
      </div>
    </article>
  );
}
