"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, ChevronDown, ChevronUp, LineChart as LineChartIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { fetchAnalyticsHistory } from "@/shared/api/fetchers/analytics-history";
import { fetchAttentionDashboard } from "@/shared/api/fetchers/attention-dashboard";
import type {
  AnalyticsAttentionPoint,
  AnalyticsHistoryFilters,
  AnalyticsResolvedMarket,
} from "@/shared/contracts/analytics-history";
import { queryKeys } from "@/shared/api/query-keys";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { compactUsd, shortAddress } from "@/features/leaderboard/lib/format";

type PeriodPreset = "24h" | "7d" | "30d" | "90d";

const PERIOD_MS: Record<PeriodPreset, number> = {
  "24h": 24 * 3_600_000,
  "7d": 7 * 24 * 3_600_000,
  "30d": 30 * 24 * 3_600_000,
  "90d": 90 * 24 * 3_600_000,
};

const PERIOD_BUTTONS: PeriodPreset[] = ["24h", "7d", "30d", "90d"];

const ANALYTICS_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "meme", label: "Meme" },
  { value: "defi", label: "DeFi" },
  { value: "layer1", label: "Layer1" },
  { value: "layer2", label: "Layer2" },
  { value: "ai", label: "AI" },
  { value: "other", label: "Other" },
] as const;

const CHART_COLORS = [
  "#22d3ee",
  "#a78bfa",
  "#34d399",
  "#fb7185",
  "#fbbf24",
  "#38bdf8",
  "#f472b6",
  "#84cc16",
  "#f97316",
  "#818cf8",
];

const TICK_STYLE = { fill: "#71717a", fontSize: 10 } as const;
const GRID_STROKE = "rgba(255,255,255,0.06)";
const TOOLTIP_STYLE = {
  background: "rgba(8,8,13,0.96)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  fontSize: "12px",
  color: "#e4e4e7",
} as const;

const NARRATIVE_DASHBOARD_LIMIT = 100;
const TABLE_PAGE_SIZE = 20;

function defaultFilters(): AnalyticsHistoryFilters {
  const to = new Date();
  const from = new Date(to.getTime() - PERIOD_MS["30d"]);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    narrative: "all",
    category: "all",
  };
}

function periodRange(period: PeriodPreset): Pick<AnalyticsHistoryFilters, "from" | "to"> {
  const to = new Date();
  const from = new Date(to.getTime() - PERIOD_MS[period]);
  return { from: from.toISOString(), to: to.toISOString() };
}

function detectActivePeriod(filters: AnalyticsHistoryFilters): PeriodPreset | null {
  const fromMs = new Date(filters.from).getTime();
  const toMs = new Date(filters.to).getTime();
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) return null;

  const diff = toMs - fromMs;
  const tolerance = 2 * 3_600_000;

  for (const period of PERIOD_BUTTONS) {
    if (Math.abs(diff - PERIOD_MS[period]) <= tolerance) return period;
  }
  return null;
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function formatAxisDate(day: string): string {
  const d = new Date(`${day}T12:00:00`);
  if (Number.isNaN(d.getTime())) return day;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatResolvedDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type ChartSeries = { slug: string; name: string };

function buildPivotedSeries(
  points: AnalyticsAttentionPoint[],
  valueKey: "attentionScore" | "convictionScore" | "volume24hUsd",
): { chartData: Record<string, string | number>[]; series: ChartSeries[] } {
  const narratives = new Map<string, string>();
  const buckets = new Map<string, Record<string, string | number>>();

  for (const point of points) {
    narratives.set(point.narrativeSlug, point.narrativeName);
    const dk = dayKey(point.date);
    const row = buckets.get(dk) ?? { date: dk, label: formatAxisDate(dk) };
    row[point.narrativeSlug] = point[valueKey];
    buckets.set(dk, row);
  }

  const chartData = [...buckets.values()].sort((a, b) =>
    String(a.date).localeCompare(String(b.date)),
  );

  const series = [...narratives.entries()]
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { chartData, series };
}

function ChartCard({
  title,
  icon: Icon,
  height,
  children,
  isLoading,
}: {
  title: string;
  icon: typeof LineChartIcon;
  height: number;
  children: ReactNode;
  isLoading?: boolean;
}) {
  return (
    <section className="glass-panel-strong overflow-hidden rounded-2xl ring-1 ring-white/[0.06]">
      <header className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-400/20">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <h2 className="text-[13px] font-semibold tracking-tight text-zinc-100">{title}</h2>
      </header>
      <div className="p-3">
        {isLoading ? (
          <div
            className="animate-pulse rounded-xl bg-zinc-800/80"
            style={{ height }}
            aria-hidden
          />
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function MultiLineChart({
  chartData,
  series,
  height,
  yDomain,
}: {
  chartData: Record<string, string | number>[];
  series: ChartSeries[];
  height: number;
  yDomain: [number, number] | ["auto", "auto"];
}) {
  if (chartData.length === 0 || series.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-white/[0.08] text-[12px] text-zinc-500"
        style={{ height }}
      >
        No data for the selected filters.
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
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
            domain={yDomain}
            tick={TICK_STYLE}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelFormatter={(_, payload) => {
              const row = payload?.[0]?.payload as { date?: string } | undefined;
              return row?.date ? formatAxisDate(row.date) : "";
            }}
            formatter={(value, name) => {
              const label = series.find((s) => s.slug === name)?.name ?? String(name);
              const num = Number(value ?? 0);
              return [
                yDomain[0] === 0 && yDomain[1] === 100
                  ? num.toFixed(1)
                  : compactUsd(num),
                label,
              ];
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ fontSize: "11px", color: "#a1a1aa", paddingTop: "8px" }}
            formatter={(value) => series.find((s) => s.slug === value)?.name ?? value}
          />
          {series.map((s, index) => (
            <Line
              key={s.slug}
              type="monotone"
              dataKey={s.slug}
              name={s.slug}
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function VolumeBarChart({
  chartData,
  series,
  height,
}: {
  chartData: Record<string, string | number>[];
  series: ChartSeries[];
  height: number;
}) {
  if (chartData.length === 0 || series.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-white/[0.08] text-[12px] text-zinc-500"
        style={{ height }}
      >
        No volume data for the selected filters.
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 6" stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="label"
            tick={TICK_STYLE}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={TICK_STYLE}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v) => compactUsd(Number(v))}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelFormatter={(_, payload) => {
              const row = payload?.[0]?.payload as { date?: string } | undefined;
              return row?.date ? formatAxisDate(row.date) : "";
            }}
            formatter={(value, name) => {
              const label = series.find((s) => s.slug === name)?.name ?? String(name);
              return [compactUsd(Number(value ?? 0)), label];
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ fontSize: "11px", color: "#a1a1aa", paddingTop: "8px" }}
            formatter={(value) => series.find((s) => s.slug === value)?.name ?? value}
          />
          {series.map((s, index) => (
            <Bar
              key={s.slug}
              dataKey={s.slug}
              name={s.slug}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
              radius={[3, 3, 0, 0]}
              maxBarSize={18}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

type TableSortKey =
  | "question"
  | "narrative"
  | "creatorAddress"
  | "outcome"
  | "totalVolume"
  | "uniqueTraders"
  | "resolvedAt";

type SortDir = "asc" | "desc";

function compareRows(
  a: AnalyticsResolvedMarket,
  b: AnalyticsResolvedMarket,
  key: TableSortKey,
  dir: SortDir,
): number {
  let cmp = 0;
  switch (key) {
    case "totalVolume":
      cmp = a.totalVolume - b.totalVolume;
      break;
    case "uniqueTraders":
      cmp = a.uniqueTraders - b.uniqueTraders;
      break;
    case "resolvedAt": {
      const aTime = a.resolvedAt ? new Date(a.resolvedAt).getTime() : 0;
      const bTime = b.resolvedAt ? new Date(b.resolvedAt).getTime() : 0;
      cmp = aTime - bTime;
      break;
    }
    default: {
      const av = (a[key] ?? "").toString().toLowerCase();
      const bv = (b[key] ?? "").toString().toLowerCase();
      cmp = av.localeCompare(bv);
    }
  }
  return dir === "asc" ? cmp : -cmp;
}

function ResolvedMarketsTable({
  rows,
  isLoading,
}: {
  rows: AnalyticsResolvedMarket[];
  isLoading?: boolean;
}) {
  const [sortKey, setSortKey] = useState<TableSortKey>("resolvedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => compareRows(a, b, sortKey, sortDir));
  }, [rows, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / TABLE_PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = sorted.slice(
    safePage * TABLE_PAGE_SIZE,
    safePage * TABLE_PAGE_SIZE + TABLE_PAGE_SIZE,
  );

  function toggleSort(key: TableSortKey) {
    setPage(0);
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "resolvedAt" || key === "totalVolume" ? "desc" : "asc");
    }
  }

  function SortHeader({ label, col }: { label: string; col: TableSortKey }) {
    const active = sortKey === col;
    return (
      <button
        type="button"
        onClick={() => toggleSort(col)}
        className="inline-flex items-center gap-1 text-left hover:text-zinc-200"
      >
        {label}
        {active ? (
          sortDir === "asc" ? (
            <ChevronUp className="h-3 w-3" aria-hidden />
          ) : (
            <ChevronDown className="h-3 w-3" aria-hidden />
          )
        ) : null}
      </button>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-800/80" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl ring-1 ring-white/[0.06]">
        <table className="w-full min-w-[900px] border-collapse text-left text-[12.5px]">
          <thead className="border-b border-white/[0.06] bg-[#08080d]/85 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            <tr>
              <th className="px-4 py-2.5">
                <SortHeader label="Market" col="question" />
              </th>
              <th className="px-4 py-2.5">
                <SortHeader label="Narrative" col="narrative" />
              </th>
              <th className="px-4 py-2.5">
                <SortHeader label="Creator" col="creatorAddress" />
              </th>
              <th className="px-4 py-2.5">
                <SortHeader label="Outcome" col="outcome" />
              </th>
              <th className="px-4 py-2.5">
                <SortHeader label="Volume" col="totalVolume" />
              </th>
              <th className="px-4 py-2.5">
                <SortHeader label="Traders" col="uniqueTraders" />
              </th>
              <th className="px-4 py-2.5">
                <SortHeader label="Resolved Date" col="resolvedAt" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-zinc-300">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                  No resolved markets in this period.
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.02]">
                  <td className="max-w-[240px] truncate px-4 py-2.5 text-zinc-100">
                    {row.question}
                  </td>
                  <td className="px-4 py-2.5">{row.narrative ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    {row.creatorAddress ? (
                      <Link
                        href={ROUTES.traderProfile(row.creatorAddress)}
                        className="font-mono text-[12px] hover:text-cyan-200"
                      >
                        {shortAddress(row.creatorAddress)}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px] uppercase">
                    {row.outcome ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 font-mono tabular-nums">
                    {compactUsd(row.totalVolume)}
                  </td>
                  <td className="px-4 py-2.5 font-mono tabular-nums">{row.uniqueTraders}</td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-zinc-400">
                    {formatResolvedDate(row.resolvedAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {sorted.length > TABLE_PAGE_SIZE ? (
        <div className="flex items-center justify-between gap-3 text-[12px] text-zinc-400">
          <p>
            Showing {safePage * TABLE_PAGE_SIZE + 1}–
            {Math.min((safePage + 1) * TABLE_PAGE_SIZE, sorted.length)} of {sorted.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg px-3 py-1.5 ring-1 ring-white/[0.08] transition hover:bg-white/[0.04] disabled:opacity-40"
            >
              Previous
            </button>
            <span className="font-mono tabular-nums">
              {safePage + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="rounded-lg px-3 py-1.5 ring-1 ring-white/[0.08] transition hover:bg-white/[0.04] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function HistoricalAnalyticsPage() {
  const [filters, setFilters] = useState<AnalyticsHistoryFilters>(defaultFilters);
  const activePeriod = detectActivePeriod(filters);

  const narrativesQuery = useQuery({
    queryKey: queryKeys.hub.attentionDashboard(NARRATIVE_DASHBOARD_LIMIT),
    queryFn: () => fetchAttentionDashboard(NARRATIVE_DASHBOARD_LIMIT),
    staleTime: 60_000,
  });

  const historyQuery = useQuery({
    queryKey: queryKeys.analytics.history(filters),
    queryFn: () =>
      fetchAnalyticsHistory({
        from: filters.from,
        to: filters.to,
        narrative: filters.narrative,
        category: filters.category,
      }),
    staleTime: 30_000,
  });

  const narrativeOptions = useMemo(() => {
    const items = narrativesQuery.data?.data ?? [];
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.narrativeSlug)) return false;
      seen.add(item.narrativeSlug);
      return true;
    });
  }, [narrativesQuery.data?.data]);

  const attentionSeries = useMemo(
    () => buildPivotedSeries(historyQuery.data?.attentionTimeSeries ?? [], "attentionScore"),
    [historyQuery.data?.attentionTimeSeries],
  );

  const convictionSeries = useMemo(
    () => buildPivotedSeries(historyQuery.data?.attentionTimeSeries ?? [], "convictionScore"),
    [historyQuery.data?.attentionTimeSeries],
  );

  const volumeSeries = useMemo(
    () => buildPivotedSeries(historyQuery.data?.attentionTimeSeries ?? [], "volume24hUsd"),
    [historyQuery.data?.attentionTimeSeries],
  );

  const isLoading = historyQuery.isLoading;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 pb-s64 pt-s48 md:pt-s56">
      <header className="border-b border-white/[0.06] pb-r24">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400/90">
          <BarChart3 className="h-3 w-3" />
          Historical tape
        </p>
        <h1 className="mt-1.5 text-balance text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
          Historical Analytics
        </h1>
        <p className="mt-1.5 max-w-2xl text-[12.5px] text-zinc-500">
          Attention, conviction, volume, and resolved-market outcomes over custom time windows.
        </p>
      </header>

      <div className="glass-panel-strong space-y-4 rounded-2xl p-4 ring-1 ring-white/[0.06]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Period
          </span>
          {PERIOD_BUTTONS.map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, ...periodRange(period) }))}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ring-1",
                activePeriod === period
                  ? "bg-cyan-500/15 text-cyan-200 ring-cyan-400/30"
                  : "bg-white/[0.03] text-zinc-400 ring-white/[0.08] hover:text-zinc-200",
              )}
            >
              {period}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex min-w-[200px] flex-1 flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Narrative
            </span>
            <select
              value={filters.narrative}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  narrative: e.target.value as AnalyticsHistoryFilters["narrative"],
                }))
              }
              className="rounded-lg border-0 bg-[#08080d] px-3 py-2 text-[13px] text-zinc-100 ring-1 ring-white/[0.1] focus:outline-none focus:ring-cyan-400/40"
            >
              <option value="all">All Narratives</option>
              {narrativeOptions.map((item) => (
                <option key={item.narrativeSlug} value={item.narrativeSlug}>
                  {item.narrativeName}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-w-[180px] flex-1 flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Category
            </span>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  category: e.target.value as AnalyticsHistoryFilters["category"],
                }))
              }
              className="rounded-lg border-0 bg-[#08080d] px-3 py-2 text-[13px] text-zinc-100 ring-1 ring-white/[0.1] focus:outline-none focus:ring-cyan-400/40"
            >
              {ANALYTICS_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-6">
        <ChartCard
          title="Attention Score Over Time"
          icon={LineChartIcon}
          height={280}
          isLoading={isLoading}
        >
          <MultiLineChart
            chartData={attentionSeries.chartData}
            series={attentionSeries.series}
            height={280}
            yDomain={[0, 100]}
          />
        </ChartCard>

        <ChartCard title="Volume Over Time" icon={BarChart3} height={240} isLoading={isLoading}>
          <VolumeBarChart
            chartData={volumeSeries.chartData}
            series={volumeSeries.series}
            height={240}
          />
        </ChartCard>

        <ChartCard
          title="Conviction Score Over Time"
          icon={LineChartIcon}
          height={280}
          isLoading={isLoading}
        >
          <MultiLineChart
            chartData={convictionSeries.chartData}
            series={convictionSeries.series}
            height={280}
            yDomain={[0, 100]}
          />
        </ChartCard>

        <section className="glass-panel-strong overflow-hidden rounded-2xl ring-1 ring-white/[0.06]">
          <header className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-400/20">
              <BarChart3 className="h-4 w-4" aria-hidden />
            </span>
            <h2 className="text-[13px] font-semibold tracking-tight text-zinc-100">
              Resolved Markets
            </h2>
          </header>
          <div className="p-3">
            <ResolvedMarketsTable
              key={`${filters.from}-${filters.to}-${filters.narrative}-${filters.category}`}
              rows={historyQuery.data?.resolvedMarkets ?? []}
              isLoading={isLoading}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
