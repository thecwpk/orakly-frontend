"use client";

import { useId, useMemo } from "react";
import { cn } from "@/lib/utils";

type Tone = "cyan" | "violet" | "emerald" | "rose" | "amber";

const TONE_STROKE: Record<Tone, string> = {
  cyan: "rgb(34,211,238)",
  violet: "rgb(167,139,250)",
  emerald: "rgb(110,231,183)",
  rose: "rgb(251,113,133)",
  amber: "rgb(251,191,36)",
};

const TONE_FILL_TOP: Record<Tone, string> = {
  cyan: "rgba(34,211,238,0.35)",
  violet: "rgba(167,139,250,0.35)",
  emerald: "rgba(110,231,183,0.35)",
  rose: "rgba(251,113,133,0.30)",
  amber: "rgba(251,191,36,0.30)",
};

/** Stronger area + stroke for terminal / hub charts */
const TONE_FILL_TOP_HIGH: Record<Tone, string> = {
  cyan: "rgba(34,211,238,0.52)",
  violet: "rgba(167,139,250,0.48)",
  emerald: "rgba(110,231,183,0.48)",
  rose: "rgba(251,113,133,0.44)",
  amber: "rgba(251,191,36,0.42)",
};

type Props = {
  /** Numeric series, any range — we auto-scale to the SVG height. */
  data: ReadonlyArray<number>;
  width?: number;
  height?: number;
  tone?: Tone;
  /** Display a soft area fill below the line. */
  fill?: boolean;
  /** Pixel padding inside the viewBox so endpoints don't clip. */
  padding?: number;
  className?: string;
  ariaLabel?: string;
  /** Highlight the last point with a glowing dot. */
  showLastDot?: boolean;
  /** Override stroke width. */
  strokeWidth?: number;
  /** Terminal-style contrast — brighter fill + heavier stroke */
  intensity?: "normal" | "high";
};

/** Build a smooth Catmull-Rom-ish cubic path from a flat numeric series. */
function buildPath(
  values: ReadonlyArray<number>,
  width: number,
  height: number,
  pad: number,
): { path: string; area: string; lastPt: { x: number; y: number } | null } {
  const n = values.length;
  if (n === 0)
    return { path: "", area: "", lastPt: null };

  let lo = Infinity;
  let hi = -Infinity;
  for (const v of values) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (lo === hi) {
    lo -= 0.5;
    hi += 0.5;
  }

  const innerW = Math.max(0, width - pad * 2);
  const innerH = Math.max(0, height - pad * 2);
  const dx = n > 1 ? innerW / (n - 1) : 0;

  const points = values.map((v, i) => {
    const x = pad + i * dx;
    const t = (v - lo) / (hi - lo);
    const y = pad + (1 - t) * innerH;
    return { x, y };
  });

  const first = points[0];
  if (!first) return { path: "", area: "", lastPt: null };
  let d = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx.toFixed(2)} ${prev.y.toFixed(2)}, ${cpx.toFixed(2)} ${curr.y.toFixed(2)}, ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
  }

  const last = points[points.length - 1]!;
  const area =
    d +
    ` L ${last.x.toFixed(2)} ${(height - pad).toFixed(2)}` +
    ` L ${first.x.toFixed(2)} ${(height - pad).toFixed(2)} Z`;

  return { path: d, area, lastPt: last };
}

/**
 * Lightweight SVG sparkline — no external chart deps. Smooth animated stroke
 * via CSS transition on the `d` attribute would be inconsistent across
 * browsers, so we fade-in on data changes via a short opacity blip on the
 * path's `key` (handled by the parent if desired).
 */
export function Sparkline({
  data,
  width = 96,
  height = 28,
  tone = "cyan",
  fill = true,
  padding = 2,
  className,
  ariaLabel,
  showLastDot = true,
  strokeWidth = 1.5,
  intensity = "normal",
}: Props) {
  const gradId = useId();
  const { path, area, lastPt } = useMemo(
    () => buildPath(data, width, height, padding),
    [data, width, height, padding],
  );

  const stroke = TONE_STROKE[tone];
  const fillTop =
    intensity === "high" ? TONE_FILL_TOP_HIGH[tone] : TONE_FILL_TOP[tone];
  const resolvedStrokeW = intensity === "high" ? Math.max(strokeWidth, 2) : strokeWidth;

  if (!path) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={cn("overflow-visible", className)}
        aria-hidden
      />
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
    >
      {fill ? (
        <>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillTop} />
              <stop offset="100%" stopColor={fillTop} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradId})`} stroke="none" />
        </>
      ) : null}
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={resolvedStrokeW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showLastDot && lastPt ? (
        <>
          <circle
            cx={lastPt.x}
            cy={lastPt.y}
            r={intensity === "high" ? 4.2 : 3.4}
            fill={stroke}
            opacity={intensity === "high" ? 0.28 : 0.18}
          />
          <circle cx={lastPt.x} cy={lastPt.y} r={intensity === "high" ? 2.2 : 1.8} fill={stroke} />
        </>
      ) : null}
    </svg>
  );
}
