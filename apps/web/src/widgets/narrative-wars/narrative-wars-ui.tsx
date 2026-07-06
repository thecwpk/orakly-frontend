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

type ScoreCellProps = {
  score: number;
  winner: boolean;
  barClassName?: string;
};

export function ScoreCell({ score, winner, barClassName = "bg-blue-500" }: ScoreCellProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));

  return (
    <div className="space-y-2">
      <span
        className={cn(
          "font-mono text-lg tabular-nums",
          winner && "font-bold text-green-600",
        )}
      >
        {clamped}
      </span>
      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn("h-full rounded-full transition-all", barClassName)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

const MOMENTUM_STYLES = {
  Growing: "bg-emerald-100 text-emerald-700",
  Cooling: "bg-red-100 text-red-700",
  Stable: "bg-gray-100 text-gray-600",
} as const;

type MomentumBadgeProps = {
  momentum: keyof typeof MOMENTUM_STYLES;
  winner?: boolean;
};

export function MomentumBadge({ momentum, winner }: MomentumBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        MOMENTUM_STYLES[momentum],
        winner && "font-bold ring-2 ring-green-400/40",
      )}
    >
      {momentum}
    </span>
  );
}

const MOMENTUM_RANK = { Growing: 3, Stable: 2, Cooling: 1 } as const;

export function compareMomentum(
  left: keyof typeof MOMENTUM_RANK,
  right: keyof typeof MOMENTUM_RANK,
): "left" | "right" | "tie" {
  const l = MOMENTUM_RANK[left];
  const r = MOMENTUM_RANK[right];
  if (l > r) return "left";
  if (r > l) return "right";
  return "tie";
}

type TrendSparklineProps = {
  data: AttentionHistoryPoint[];
  loading?: boolean;
};

function TrendSparklineInner({ data, loading }: TrendSparklineProps) {
  if (loading) {
    return <div className="h-[60px] animate-pulse rounded bg-gray-200" />;
  }

  const chartData =
    data.length > 0
      ? data.map((point, index) => ({ ...point, index }))
      : [{ index: 0, attentionScore: 0 }, { index: 1, attentionScore: 0 }];

  return (
    <div className="h-[60px] w-full">
      <ResponsiveContainer width="100%" height={60}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <Line
            type="monotone"
            dataKey="attentionScore"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            isAnimationActive={chartData.length < 40}
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

export function winnerCellClass(side: "left" | "right", winner: "left" | "right" | "tie") {
  return cn(
    "rounded-lg p-3",
    winner === side && "bg-green-50",
  );
}
