"use client";

import { useId, useMemo } from "react";
import { cn } from "@/lib/utils";

/** Polymarket-style probability / chart accent */
const PM_BLUE = "#2797FF";
const STROKE = PM_BLUE;

function clampProb(v: number): number {
  if (!Number.isFinite(v)) return 0.5;
  return Math.min(0.999, Math.max(0.001, v));
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/** Y-axis window tightened around the series (PM often shows ~0–40% instead of 0–100%). */
function yDomain(values: readonly number[]): { lo: number; hi: number } {
  if (!values.length) return { lo: 0, hi: 1 };
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of values) {
    if (!Number.isFinite(v)) continue;
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return { lo: 0, hi: 1 };
  if (lo === hi) {
    lo = clamp01(lo - 0.06);
    hi = clamp01(hi + 0.06);
    return { lo, hi };
  }
  const span = hi - lo;
  const pad = Math.max(0.02, span * 0.35);
  return {
    lo: clamp01(lo - pad),
    hi: clamp01(hi + pad),
  };
}

function buildSmoothPath(
  values: readonly number[],
  width: number,
  height: number,
  padL: number,
  padR: number,
  padT: number,
  padB: number,
  lo: number,
  hi: number,
): { d: string; areaD: string; last: { x: number; y: number } | null } {
  const innerW = Math.max(0, width - padL - padR);
  const innerH = Math.max(0, height - padT - padB);
  const n = values.length;
  const denom = hi - lo || 1;
  if (n === 0 || innerW <= 0 || innerH <= 0) return { d: "", areaD: "", last: null };

  const dx = n > 1 ? innerW / (n - 1) : 0;
  const pts = values.map((raw, i) => {
    const x = padL + i * dx;
    const v = clampProb(raw);
    const t = (clamp01(v) - lo) / denom;
    const y = padT + (1 - t) * innerH;
    return { x, y };
  });

  const first = pts[0]!;
  let d = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]!;
    const curr = pts[i]!;
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx.toFixed(2)} ${prev.y.toFixed(2)}, ${cpx.toFixed(2)} ${curr.y.toFixed(2)}, ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
  }

  const last = pts[pts.length - 1]!;
  const baseY = padT + innerH;
  const areaD = `${d} L ${last.x.toFixed(2)} ${baseY.toFixed(2)} L ${first.x.toFixed(2)} ${baseY.toFixed(2)} Z`;
  return { d, areaD, last };
}

/** Synthetic date stamps along X (chart buffer ≈ short window). */
function xTickLabels(pointCount: number): string[] {
  const n = Math.max(2, pointCount);
  const now = Date.now();
  const spanMs = 5 * 24 * 60 * 60 * 1000;
  const fmt = (t: number) =>
    new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return Array.from({ length: n }, (_, i) => {
    const frac = (n - 1 - i) / Math.max(1, n - 1);
    return fmt(now - frac * spanMs);
  });
}

type Props = {
  data: ReadonlyArray<number>;
  width: number;
  height?: number;
  className?: string;
  ariaLabel: string;
  /** Sit on parent card bg — no inner grey slab */
  variant?: "panel" | "flush";
};

export function HubSpotlightTradingChart({
  data,
  width,
  height = 196,
  className,
  ariaLabel,
  variant = "panel",
}: Props) {
  const gradId = useId().replace(/:/g, "");
  const padL = 14;
  const padR = 40;
  const padT = 10;
  const padBX = 22;

  const { ticks, pathD, areaD, last, xLabels } = useMemo(() => {
    const { lo: yLo, hi: yHi } = yDomain(data);
    const innerH = Math.max(0, height - padT - padBX);
    const tickVals = [1, 0.75, 0.5, 0.25, 0].map((u) => yLo + u * (yHi - yLo));
    const lines = tickVals.map((tv) => ({
      y: padT + (1 - (clamp01(tv) - yLo) / (yHi - yLo || 1)) * innerH,
      label: `${Math.round(tv * 100)}%`,
    }));
    const { d, areaD: ad, last: lp } = buildSmoothPath(
      data,
      width,
      height,
      padL,
      padR,
      padT,
      padBX,
      yLo,
      yHi,
    );
    const xl = xTickLabels(data.length);
    return {
      ticks: lines,
      pathD: d,
      areaD: ad,
      last: lp,
      xLabels: xl,
    };
  }, [data, width, height]);

  const innerW = Math.max(0, width - padL - padR);

  const xTickIndices = useMemo(() => {
    const n = data.length;
    if (n < 2) return [];
    const want = 5;
    const idx: number[] = [];
    for (let k = 0; k < want; k++) {
      idx.push(Math.round((k / (want - 1)) * (n - 1)));
    }
    return [...new Set(idx)].sort((a, b) => a - b);
  }, [data.length]);

  if (width < 48) {
    return (
      <div
        className={cn("flex min-h-[140px] items-center justify-center rounded-lg bg-[#111114]", className)}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={cn(
        variant === "flush"
          ? "relative bg-transparent"
          : "relative rounded-xl bg-[#111114]/90",
        className,
      )}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
        role="img"
        aria-label={ariaLabel}
      >
        <title>{ariaLabel}</title>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={STROKE} stopOpacity="0.32" />
            <stop offset="55%" stopColor={STROKE} stopOpacity="0.1" />
            <stop offset="100%" stopColor={STROKE} stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map(({ y, label }) => (
          <g key={label}>
            <line
              x1={padL}
              x2={padL + innerW}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.14)"
              strokeWidth={1}
              strokeDasharray="3 7"
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={width - 6}
              y={y + 3.5}
              textAnchor="end"
              fill="rgba(212,212,216,0.92)"
              fontSize={10}
              fontFamily="ui-monospace, monospace"
              className="tabular-nums"
            >
              {label}
            </text>
          </g>
        ))}

        {areaD ? <path d={areaD} fill={`url(#${gradId})`} stroke="none" /> : null}

        {pathD ? (
          <path
            d={pathD}
            fill="none"
            stroke={STROKE}
            strokeWidth={2.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {last ? (
          <>
            <circle cx={last.x} cy={last.y} r={5} fill={STROKE} opacity={0.16} />
            <circle cx={last.x} cy={last.y} r={2.25} fill={STROKE} stroke="rgba(0,0,0,0.35)" strokeWidth={0.75} />
          </>
        ) : null}

        {xTickIndices.map((i) => {
          const x = padL + (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2);
          const lbl = xLabels[i] ?? "";
          return (
            <text
              key={i}
              x={x}
              y={height - 5}
              textAnchor="middle"
              fill="rgba(161,161,170,0.98)"
              fontSize={9}
              fontFamily="ui-monospace, monospace"
            >
              {lbl}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
