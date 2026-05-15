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
import {
  buildImpliedHistory,
  buildVolumeHistory,
  type ImpliedPoint,
  type VolumePoint,
} from "../lib/series";

type Tab = "implied" | "volume";

const CHART_MARGIN = { top: 2, right: 6, left: -18, bottom: 0 } as const;
const IMP_DOMAIN: [number, number] = [0, 100];
const TICK_STYLE = { fill: "#52525b", fontSize: 9 } as const;
const GRID_STROKE = "rgba(255,255,255,0.06)";
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
  volumeUsd,
  midYes,
  odds,
  rt,
  chartHeight = 220,
}: {
  slug: string;
  volumeUsd: number;
  midYes: number;
  odds: MarketOddsDto | undefined;
  rt: MarketRealtimeSnapshot;
  chartHeight?: number;
}) {
  const [tab, setTab] = useState<Tab>("implied");
  const { ref: boxRef, width: chartWidth } = useChartBoxWidth();

  const impliedData = useMemo<ImpliedPoint[]>(() => {
    const base = buildImpliedHistory(slug, midYes, 52);
    if (!odds?.yesPrice) return base;
    const y = Number.parseFloat(odds.yesPrice);
    if (Number.isFinite(y) && base.length > 0) {
      const copy = [...base];
      copy[copy.length - 1] = { ...copy[copy.length - 1]!, yes: y };
      return copy;
    }
    return base;
  }, [slug, midYes, odds?.yesPrice]);

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
    () => buildVolumeHistory(volumeUsd, slug),
    [volumeUsd, slug],
  );

  const impliedChartRows = useMemo(
    () =>
      impliedLive.map((p) => ({
        ...p,
        yesPct: Math.round(p.yes * 1000) / 10,
      })),
    [impliedLive],
  );

  const volumeChartRows = useMemo(
    () =>
      volData.map((p) => ({
        ...p,
        volM: Math.round(p.vol / 1e6),
      })),
    [volData],
  );

  const isHero = chartHeight >= 300;
  const canRenderChart = chartWidth >= 48;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-white/[0.06] bg-[#07070d]/95 shadow-black/20 ring-1 ring-white/[0.05]",
        isHero ? "shadow-md" : "shadow-sm shadow-black/15 ring-cyan-500/10",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/6 px-3 py-1.5 sm:py-2">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
            Probability
          </p>
          <p
            className={cn(
              "font-semibold text-white",
              isHero ? "text-[13px] sm:text-sm" : "text-[12.5px]",
            )}
          >
            {tab === "implied" ? "YES implied — chart" : "Volume histogram"}
          </p>
        </div>
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
                domain={IMP_DOMAIN}
                tickFormatter={formatYTickPct}
                tick={TICK_STYLE}
                axisLine={false}
                tickLine={false}
                width={32}
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
