"use client";

import { useId, useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type MarketProbabilitySparklineProps = {
  seed: string;
  endPct: number;
  compact?: boolean;
};

export function MarketProbabilitySparkline({ seed, endPct, compact }: MarketProbabilitySparklineProps) {
  const reactId = useId().replace(/:/g, "");
  const gradId = `spark-${reactId}`;

  const data = useMemo(() => {
    const n = compact ? 28 : 40;
    const rng = mulberry32(hashString(seed));
    const pts: { i: number; p: number }[] = [];
    let cur = 42 + rng() * 16;
    for (let i = 0; i < n - 1; i++) {
      cur += (rng() - 0.48) * 4;
      cur = Math.min(94, Math.max(6, cur));
      pts.push({ i, p: Math.round(cur * 10) / 10 });
    }
    pts.push({ i: n - 1, p: endPct });
    return pts;
  }, [seed, endPct, compact]);

  return (
    <div className="h-full w-full min-h-[72px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--yes)" stopOpacity={0.38} />
              <stop offset="100%" stopColor="var(--yes)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={[0, 100]} hide />
          <Area
            type="monotone"
            dataKey="p"
            stroke="var(--yes)"
            strokeWidth={2}
            fill={`url(#${gradId})`}
            fillOpacity={1}
            isAnimationActive={false}
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
