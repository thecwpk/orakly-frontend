"use client";

import type { MarketOddsDto } from "@/shared/api/fetchers/markets-live";
import type { MarketRealtimeSnapshot } from "@/websocket/store/market-realtime-store";
import { memo, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { marketDetailPanelClass } from "./market-detail-section";
import {
  buildImpliedHistoryFromSnapshots,
  buildVolumeHistory,
  impliedYDomain,
  type ImpliedPoint,
  type VolumePoint,
} from "../lib/series";
import { useMarketOddsHistoryQuery } from "@/shared/api/hooks";

type Tab = "implied" | "volume";

const CHART_MARGIN = { top: 8, right: 8, left: 2, bottom: 0 } as const;
const TICK_STYLE = { fill: "var(--md-muted)", fontSize: 10 } as const;
const GRID_STROKE = "rgba(255,255,255,0.12)";
const TOOLTIP_IMPLIED_STYLE = {
  background: "rgba(10,10,12,0.94)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  fontSize: "12px",
} as const;
const TOOLTIP_VOL_STYLE = {
  background: "rgba(10,10,12,0.94)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  fontSize: "12px",
} as const;
const ACTIVE_DOT = { r: 3 } as const;

function formatYTickPct(v: number) {
  return `${v}%`;
}

function impliedTooltipFormatter(value: unknown) {
  return [`${Number(value ?? 0)}%`, "YES"];
}

function volumeTooltipFormatter(value: unknown) {
  return [`$${Number(value ?? 0)}M`, "Notional"];
}

/** Avoid Recharts `ResponsiveContainer` resize loops (React error #185 on flex layouts). */
function useChartBoxWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const next = Math.floor(el.getBoundingClientRect().width);
        setWidth((prev) => (prev === next ? prev : next));
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return { ref, width };
}

function MarketChartPanelInner({
  slug,
  marketId,
  volumeUsd,
  midYes,
  odds,
  rt,
  chartHeight = 220,
}: {
  slug: string;
  marketId: string | null;
  volumeUsd: number;
  midYes: number;
  odds: MarketOddsDto | undefined;
  rt: MarketRealtimeSnapshot;
  chartHeight?: number;
}) {
  const [tab, setTab] = useState<Tab>("implied");
  const { ref: boxRef, width: chartWidth } = useChartBoxWidth();
  const oddsHistoryQ = useMarketOddsHistoryQuery(marketId ?? undefined);

  const impliedData = useMemo<ImpliedPoint[]>(() => {
    const y =
      odds?.yesPrice != null && Number.isFinite(Number.parseFloat(odds.yesPrice))
        ? Number.parseFloat(odds.yesPrice)
        : midYes;
    return buildImpliedHistoryFromSnapshots(slug, y, oddsHistoryQ.data ?? []);
  }, [midYes, odds?.yesPrice, oddsHistoryQ.data, slug]);

  const impliedLive = useMemo(() => {
    if (!rt.odds?.yesPrice) return impliedData;
    const y = Number.parseFloat(rt.odds.yesPrice);
    if (!Number.isFinite(y)) return impliedData;
    const copy = [...impliedData];
    if (copy.length === 0) return [{ label: "now", yes: y }];
    copy[copy.length - 1] = { ...copy[copy.length - 1]!, yes: y };
    return copy;
  }, [impliedData, rt.odds?.yesPrice]);

  const volData = useMemo<VolumePoint[]>(
    () => buildVolumeHistory(volumeUsd),
    [volumeUsd],
  );

  const impliedChartRows = useMemo(
    () =>
      impliedLive.map((p) => ({
        ...p,
        yesPct: Math.round(p.yes * 1000) / 10,
      })),
    [impliedLive],
  );

  const impliedDomain = useMemo(
    () => impliedYDomain(impliedChartRows),
    [impliedChartRows],
  );

  const volumeChartRows = useMemo(
    () =>
      volData.map((p) => ({
        ...p,
        volM: Math.round(p.vol / 1e6),
      })),
    [volData],
  );

  const canRenderChart = chartWidth >= 48;

  return (
    <div className={cn(marketDetailPanelClass, "overflow-hidden")}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--md-border)] px-3 py-2">
        <p className="truncate text-[11px] text-[var(--md-muted)]">
          {tab === "implied" ? "YES probability" : "24h volume"}
        </p>
        <div className="flex rounded-md bg-black/35 p-0.5 ring-1 ring-white/10">
          {(
            [
              ["implied", "Price"],
              ["volume", "Volume"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={
                tab === id ?
                  "rounded bg-white/10 px-2 py-1 text-[10px] font-semibold text-cyan-200 ring-1 ring-cyan-400/25"
                : "rounded px-2 py-1 text-[10px] font-medium text-zinc-500 transition hover:text-zinc-300"
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={boxRef}
        className="w-full min-h-0 min-w-[48px] px-1.5 pb-1 pt-1.5 sm:pb-1.5 sm:pt-2"
        style={{ height: chartHeight, minHeight: chartHeight }}
      >
        {canRenderChart ?
          tab === "implied" ?
            <AreaChart
              width={chartWidth}
              height={chartHeight}
              data={impliedChartRows}
              margin={CHART_MARGIN}
            >
              <defs>
                <linearGradient id="yesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(34,211,238)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="rgb(34,211,238)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="label" tick={TICK_STYLE} axisLine={false} tickLine={false} />
              <YAxis
                domain={impliedDomain}
                tickFormatter={formatYTickPct}
                tick={TICK_STYLE}
                axisLine={false}
                tickLine={false}
                width={40}
                allowDataOverflow
              />
              <Tooltip contentStyle={TOOLTIP_IMPLIED_STYLE} formatter={impliedTooltipFormatter} />
              <Area
                type="monotone"
                dataKey="yesPct"
                stroke="rgb(34,211,238)"
                strokeWidth={2}
                fill="url(#yesFill)"
                dot={false}
                activeDot={ACTIVE_DOT}
              />
            </AreaChart>
          : <BarChart
              width={chartWidth}
              height={chartHeight}
              data={volumeChartRows}
              margin={CHART_MARGIN}
            >
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(167,139,250)" />
                  <stop offset="100%" stopColor="rgb(52,211,153)" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="label" tick={TICK_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={TOOLTIP_VOL_STYLE} formatter={volumeTooltipFormatter} />
              <Bar dataKey="volM" fill="url(#volGrad)" radius={[4, 4, 0, 0]} />
            </BarChart>
        : <div
            className="flex h-full w-full items-center justify-center text-[11px] text-zinc-600"
            style={{ height: chartHeight }}
          >
            Loading chart…
          </div>
        }
      </div>
      {rt.seq > 0 ?
        <div className="border-t border-white/6 px-3 py-1.5 text-[9px] text-zinc-600">
          Realtime batch seq <span className="font-mono text-zinc-400">{rt.seq}</span>
        </div>
      : null}
    </div>
  );
}

export const MarketChartPanel = memo(MarketChartPanelInner);
