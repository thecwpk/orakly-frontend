"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchMarketOddsChart } from "@/shared/api/fetchers/markets-live";
import { queryKeys } from "@/shared/api/query-keys";
import { cn } from "@/lib/utils";
import type { MarketOddsPeriod } from "@/shared/contracts/market-detail";

const PERIODS: MarketOddsPeriod[] = ["1H", "24H", "7D", "All"];

export function MarketPriceChart({ marketId }: { marketId: string }) {
  const [period, setPeriod] = useState<MarketOddsPeriod>("24H");
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(Math.floor(w));
    });
    ro.observe(el);
    setWidth(Math.floor(el.clientWidth));
    return () => ro.disconnect();
  }, []);

  const chartQ = useQuery({
    queryKey: [...queryKeys.markets.odds(marketId), "chart", period],
    queryFn: () => fetchMarketOddsChart(marketId, period),
    staleTime: 30_000,
  });

  const data = (chartQ.data ?? []).map((p) => ({
    ...p,
    label: new Date(p.time).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  return (
    <section className="rounded-2xl border border-white/[0.08] p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[18px] font-semibold text-zinc-100">Price History</h2>
        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-full px-3 py-1 text-[12px] font-semibold transition",
                period === p
                  ? "bg-blue-600 text-white"
                  : "text-zinc-400 ring-1 ring-white/10 hover:bg-white/[0.05]",
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div ref={boxRef} className="w-full">
        {chartQ.isLoading && data.length === 0 ? (
          <div className="h-[280px] animate-pulse rounded-xl bg-zinc-800/60" />
        ) : data.length === 0 ? (
          <p className="flex h-[280px] items-center justify-center text-[14px] text-zinc-500">
            No price history yet
          </p>
        ) : (
          <LineChart width={width} height={280} data={data} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#8b9cb3", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#8b9cb3", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(value, name) => {
                const n = typeof value === "number" ? value : Number(value);
                if (name === "volume") return [`$${n.toFixed(0)}`, "Volume"];
                return [`${n.toFixed(1)}%`, String(name).toUpperCase()];
              }}
              labelFormatter={(label) => String(label)}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="yes"
              name="YES"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="no"
              name="NO"
              stroke="#fb7185"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        )}
      </div>
    </section>
  );
}
