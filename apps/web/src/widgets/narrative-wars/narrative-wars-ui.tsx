"use client";

import { memo } from "react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import type { AttentionHistoryPoint } from "@/shared/contracts/attention-history";
import { cn } from "@/lib/utils";

const usdCompact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatUsd(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "$0";
  return `$${usdCompact.format(value)}`;
}

export function formatCount(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return String(value);
}

const GAUGE_C = 2 * Math.PI * 18;

function scoreStroke(score: number): string {
  if (score <= 33) return "#f87171";
  if (score <= 66) return "#fbbf24";
  return "#34d399";
}

/** Mini circular gauge matching AttentionScoreCard feel. */
export function ScoreGaugeCell({
  score,
  winner,
}: {
  score: number;
  winner: boolean;
}) {
  const value = Math.min(100, Math.max(0, Math.round(score)));
  const dash = (value / 100) * GAUGE_C;
  const stroke = scoreStroke(value);

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-12 w-12 shrink-0">
        <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
          <circle
            cx="24"
            cy="24"
            r="18"
            fill="none"
            stroke={stroke}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${GAUGE_C}`}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-zinc-100">
          {value}
        </span>
      </div>
      <span
        className={cn(
          "font-mono text-[18px] tabular-nums text-zinc-200",
          winner && "font-bold text-emerald-400",
        )}
      >
        {value}
      </span>
    </div>
  );
}

const MOMENTUM_STYLES = {
  Growing: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/25",
  Cooling: "bg-rose-500/15 text-rose-300 ring-rose-400/25",
  Stable: "bg-zinc-500/15 text-zinc-300 ring-white/10",
} as const;

export function MomentumBadge({
  momentum,
}: {
  momentum: keyof typeof MOMENTUM_STYLES;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        MOMENTUM_STYLES[momentum],
      )}
    >
      {momentum}
    </span>
  );
}

type TrendSparklineProps = {
  data: AttentionHistoryPoint[];
  loading?: boolean;
  stroke?: string;
};

function TrendSparklineInner({
  data,
  loading,
  stroke = "#60a5fa",
}: TrendSparklineProps) {
  if (loading) {
    return <div className="h-[50px] w-full animate-pulse rounded-lg bg-zinc-800/80" />;
  }

  const chartData =
    data.length > 0
      ? data.map((point, index) => ({
          index,
          attentionScore: point.attentionScore,
        }))
      : [
          { index: 0, attentionScore: 0 },
          { index: 1, attentionScore: 0 },
        ];

  return (
    <div className="h-[50px] w-full">
      <ResponsiveContainer width="100%" height={50}>
        <LineChart data={chartData} margin={{ top: 4, right: 2, left: 2, bottom: 4 }}>
          <Line
            type="monotone"
            dataKey="attentionScore"
            stroke={stroke}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export const TrendSparkline = memo(TrendSparklineInner);

export function numericWinner(
  left: number,
  right: number,
): "left" | "right" | "tie" {
  if (left > right) return "left";
  if (right > left) return "right";
  return "tie";
}

export function winnerTextClass(side: "left" | "right", winner: "left" | "right" | "tie") {
  return cn(
    "text-zinc-200",
    winner === side && "font-bold text-emerald-400",
  );
}
