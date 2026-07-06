"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchAttentionHistory } from "@/shared/api/fetchers/narrative-detail";
import { queryKeys } from "@/shared/api/query-keys";
import type { AttentionHistoryPeriod } from "@/shared/contracts/attention-history";
import { cn } from "@/lib/utils";

const PERIODS: AttentionHistoryPeriod[] = ["24h", "7d", "30d"];

const TICK_STYLE = { fill: "#6b7280", fontSize: 10 } as const;
const GRID_STROKE = "rgba(0,0,0,0.08)";
const TOOLTIP_STYLE = {
  background: "rgba(255,255,255,0.98)",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: "10px",
  fontSize: "12px",
} as const;

function formatAxisDate(iso: string, period: AttentionHistoryPeriod): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  if (period === "24h") {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type NarrativeHistoryChartProps = {
  slug: string;
};

export function NarrativeHistoryChart({ slug }: NarrativeHistoryChartProps) {
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
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Historical scores
        </h2>
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                period === p
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-800",
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {showSkeleton ? (
        <div className="h-[280px] animate-pulse rounded-xl bg-gray-200" />
      ) : (
        <div className="h-[280px] w-full rounded-xl border border-gray-200 bg-white p-3">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 6" stroke={GRID_STROKE} vertical={false} />
              <XAxis
                dataKey="label"
                tick={TICK_STYLE}
                axisLine={false}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                domain={[0, 100]}
                tick={TICK_STYLE}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as { date?: string } | undefined;
                  return row?.date ? new Date(row.date).toLocaleString() : "";
                }}
                formatter={(value, name) => [
                  Number(value ?? 0).toFixed(1),
                  name === "attentionScore" ? "Attention" : "Conviction",
                ]}
              />
              <Line
                type="monotone"
                dataKey="attentionScore"
                name="attentionScore"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="convictionScore"
                name="convictionScore"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
