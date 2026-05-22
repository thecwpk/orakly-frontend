"use client";

import { formatCompactUsd } from "@orakly/utils";
import { ArrowDownRight, ArrowUpRight, BarChart3 } from "lucide-react";
import { memo, useId, useMemo } from "react";
import { useMarketVolumeWindowQuery } from "@/shared/api/hooks";
import type { MarketRealtimeSnapshot } from "@/websocket/store/market-realtime-store";
import { cn } from "@/lib/utils";
import { marketDetailPanelClass } from "./market-detail-section";
import {
  mergeTradesIntoVolumeRows,
  summarizeVolumeChartRows,
  type VolumeChartRow,
} from "../lib/volume-history";

const VB_W = 520;
const VB_H = 148;
const PAD = { l: 44, r: 44, t: 10, b: 28 };
const INNER_W = VB_W - PAD.l - PAD.r;
const INNER_H = VB_H - PAD.t - PAD.b;

function VolumeSvgChart({ rows, gradBuyId, gradSellId }: { rows: VolumeChartRow[]; gradBuyId: string; gradSellId: string }) {
  const n = rows.length || 1;
  const slotW = INNER_W / n;
  const barW = Math.max(2, slotW * 0.58);
  const maxStack = Math.max(1, ...rows.map((r) => r.buy + r.sell));
  const maxCum = Math.max(1, ...rows.map((r) => r.cumulative));
  const baselineY = PAD.t + INNER_H;

  const linePts = rows
    .map((r, i) => {
      const cx = PAD.l + i * slotW + slotW / 2;
      const cy = PAD.t + INNER_H - (r.cumulative / maxCum) * INNER_H;
      return `${cx.toFixed(1)},${cy.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className="h-[168px] w-full text-zinc-500"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="24 hour volume chart"
    >
      <defs>
        <linearGradient id={gradBuyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(52,211,153)" stopOpacity={0.95} />
          <stop offset="100%" stopColor="rgb(52,211,153)" stopOpacity={0.45} />
        </linearGradient>
        <linearGradient id={gradSellId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(251,113,133)" stopOpacity={0.85} />
          <stop offset="100%" stopColor="rgb(251,113,133)" stopOpacity={0.4} />
        </linearGradient>
      </defs>

      {/* grid line at zero */}
      <line
        x1={PAD.l}
        y1={baselineY}
        x2={VB_W - PAD.r}
        y2={baselineY}
        stroke="rgba(255,255,255,0.06)"
        strokeDasharray="3 6"
      />

      {rows.map((r, i) => {
        const cx = PAD.l + i * slotW + slotW / 2;
        const x = cx - barW / 2;
        const total = r.buy + r.sell;
        const totalH = (total / maxStack) * INNER_H;
        const sellH = total > 0 ? (r.sell / total) * totalH : 0;
        const buyH = totalH - sellH;
        const title = `${r.label}: buy ${formatCompactUsd(r.buy)} · sell ${formatCompactUsd(r.sell)}`;

        return (
          <g key={`${r.at}-${i}`}>
            <title>{title}</title>
            {sellH > 0.5 ? (
              <rect
                x={x}
                y={baselineY - sellH}
                width={barW}
                height={sellH}
                fill={`url(#${gradSellId})`}
                rx={2}
              />
            ) : null}
            {buyH > 0.5 ? (
              <rect
                x={x}
                y={baselineY - totalH}
                width={barW}
                height={buyH}
                fill={`url(#${gradBuyId})`}
                rx={2}
              />
            ) : null}
          </g>
        );
      })}

      <polyline
        fill="none"
        stroke="rgb(167,139,250)"
        strokeWidth={1.5}
        points={linePts}
      />

      {/* x ticks */}
      {rows.map((r, i) =>
        i % 3 === 0 ? (
          <text
            key={`xl-${r.at}`}
            x={PAD.l + i * slotW + slotW / 2}
            y={VB_H - 8}
            textAnchor="middle"
            fill="#71717a"
            fontSize={9}
          >
            {r.label}
          </text>
        ) : null,
      )}

      {/* y ticks (compact) */}
      <text x={4} y={PAD.t + 10} fill="#52525b" fontSize={9}>
        {formatCompactUsd(maxStack)}
      </text>
      <text x={4} y={baselineY - 4} fill="#52525b" fontSize={9}>
        0
      </text>
      <text x={VB_W - PAD.r + 4} y={PAD.t + 10} fill="#52525b" fontSize={9} textAnchor="end">
        {formatCompactUsd(maxCum)}
      </text>
    </svg>
  );
}

function MarketVolumeChartInner({
  slug,
  rt,
  className,
}: {
  slug: string;
  rt: MarketRealtimeSnapshot;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const gradBuyId = `volBuySvg-${uid}`;
  const gradSellId = `volSellSvg-${uid}`;

  const q = useMarketVolumeWindowQuery(slug);

  const mergedRows = useMemo(() => {
    const base = q.data?.rows ?? [];
    return mergeTradesIntoVolumeRows(base, rt.tradesRecent);
  }, [q.data?.rows, rt.tradesRecent]);

  const win = useMemo(() => summarizeVolumeChartRows(mergedRows), [mergedRows]);

  const buyPct = win.totalUsd > 0 ? (win.buyUsd / win.totalUsd) * 100 : 50;
  const sellPct = 100 - buyPct;
  const imbalanceLabel = `${(win.imbalance * 100).toFixed(0)}%`;
  const imbalancePositive = win.imbalance >= 0;

  const chartBody =
    q.isLoading ? (
      <div className="flex h-[168px] w-full items-center justify-center rounded-lg bg-white/[0.02] text-xs text-zinc-600">
        Loading volume…
      </div>
    ) : q.isError ? (
      <div className="flex h-[168px] w-full items-center justify-center rounded-lg bg-white/[0.02] text-xs text-rose-400/90">
        Could not load volume chart
      </div>
    ) : mergedRows.length === 0 ? (
      <div className="flex h-[168px] w-full items-center justify-center text-xs text-zinc-600">
        No data
      </div>
    ) : (
      <VolumeSvgChart rows={mergedRows} gradBuyId={gradBuyId} gradSellId={gradSellId} />
    );

  return (
    <div
      className={cn(
        marketDetailPanelClass,
        "flex flex-col overflow-hidden",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-2.5 py-2">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-300">
            <BarChart3 className="h-3 w-3 text-zinc-500" />
            24h · {formatCompactUsd(win.totalUsd)}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10.5px] tabular-nums text-emerald-300 ring-1 ring-emerald-500/25">
            <ArrowUpRight className="h-2.5 w-2.5" />
            {formatCompactUsd(win.buyUsd)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-1.5 py-0.5 font-mono text-[10.5px] tabular-nums text-rose-300 ring-1 ring-rose-500/25">
            <ArrowDownRight className="h-2.5 w-2.5" />
            {formatCompactUsd(win.sellUsd)}
          </span>
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 font-mono text-[10.5px] ring-1",
              imbalancePositive
                ? "bg-emerald-500/12 text-emerald-300 ring-emerald-500/25"
                : "bg-rose-500/12 text-rose-300 ring-rose-500/25",
            )}
            title="Net buy/sell imbalance"
          >
            Δ {imbalanceLabel}
          </span>
        </div>
      </div>

      <div className="px-4 pt-3">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-zinc-500">
          <span>Buy</span>
          <span>Sell</span>
        </div>
        <div
          className="mt-1 h-1.5 overflow-hidden rounded-full bg-rose-500/30 ring-1 ring-white/[0.04]"
          aria-label="Buy vs sell ratio"
        >
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400"
            style={{ width: `${buyPct}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between font-mono text-[10px] tabular-nums text-zinc-500">
          <span>{buyPct.toFixed(0)}%</span>
          <span>{sellPct.toFixed(0)}%</span>
        </div>
      </div>

      <div className="min-h-0 min-w-0 w-full px-2 pb-2 pt-2">{chartBody}</div>
    </div>
  );
}

export const MarketVolumeChart = memo(MarketVolumeChartInner, (a, b) => {
  return (
    a.slug === b.slug &&
    a.className === b.className &&
    a.rt.seq === b.rt.seq &&
    a.rt.tradesRecent === b.rt.tradesRecent
  );
});
