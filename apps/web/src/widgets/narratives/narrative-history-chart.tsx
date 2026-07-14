"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { fetchAttentionHistory } from "@/shared/api/fetchers/narrative-detail";
import { queryKeys } from "@/shared/api/query-keys";
import type { AttentionHistoryPeriod } from "@/shared/contracts/attention-history";
import { cn } from "@/lib/utils";

const PERIODS: { id: AttentionHistoryPeriod; label: string }[] = [
  { id: "24h", label: "24H" },
  { id: "7d", label: "7D" },
  { id: "30d", label: "30D" },
];

function formatAxisDate(iso: string, period: AttentionHistoryPeriod): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  if (period === "24h") {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function NarrativeHistoryChart({ slug }: { slug: string }) {
  const [period, setPeriod] = useState<AttentionHistoryPeriod>("7d");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.hub.attentionHistory(slug, period),
    queryFn: () => fetchAttentionHistory(slug, period),
    staleTime: 60_000,
  });

  const chartData = useMemo(
    () =>
      (data?.data ?? []).map((point) => ({
        ...point,
        label: formatAxisDate(point.date, period),
      })),
    [data?.data, period],
  );

  const showSkeleton = isLoading || (isFetching && chartData.length === 0);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[18px] font-semibold text-zinc-100">Attention History</h2>
        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={cn(
                "rounded-full px-3 py-1 text-[12px] font-semibold transition",
                period === p.id
                  ? "bg-blue-600 text-white"
                  : "text-zinc-400 ring-1 ring-white/10 hover:bg-white/[0.05]",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {showSkeleton ? (
        <div className="h-[280px] animate-pulse rounded-xl bg-zinc-800/60" />
      ) : chartData.length === 0 ? (
        <p className="flex h-[280px] items-center justify-center text-[14px] text-zinc-500">
          No history yet
        </p>
      ) : (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#8b9cb3", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#8b9cb3", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as { date?: string } | undefined;
                  return row?.date ? new Date(row.date).toLocaleString() : "";
                }}
                formatter={(value, name) => [
                  Number(value ?? 0).toFixed(1),
                  name === "attentionScore" ? "Attention" : "Conviction",
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="attentionScore"
                name="Attention"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="convictionScore"
                name="Conviction"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
