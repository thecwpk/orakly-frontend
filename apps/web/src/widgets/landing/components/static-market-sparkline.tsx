/**
 * Pre-baked SVG sparkline for the landing hero preview.
 *
 * The animated, recharts-driven `<MarketProbabilitySparkline>` runs a
 * `mulberry32` RNG + ResponsiveContainer on first paint of the marketing
 * page — useless ceremony for a decorative curve. This component renders
 * a single SVG `<path>` that gzips to ~0.4 KB and never re-renders.
 *
 * Path tuned to end at the supplied `endPct` height (0-100) so callers
 * can keep the YES probability number numerically honest with the curve.
 */

import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & {
  /** YES probability the curve should terminate at (0-100). */
  endPct: number;
};

const POINTS: ReadonlyArray<readonly [number, number]> = [
  [0, 52], [6, 48], [12, 55], [18, 50], [24, 58], [30, 54], [36, 60], [42, 56],
  [48, 62], [54, 58], [60, 65], [66, 61], [72, 56], [78, 62], [84, 58], [90, 64],
  [96, 60], [100, 64],
];

export function StaticMarketSparkline({ endPct, className, ...rest }: Props) {
  const w = 200;
  const h = 80;
  const projected = POINTS.map(([x, y], i): [number, number] => {
    if (i === POINTS.length - 1) return [x, endPct];
    return [x, y + (endPct - 64) * (i / (POINTS.length - 1))];
  });
  const toCoords = ([x, y]: readonly [number, number]) => {
    const cx = (x / 100) * w;
    const cy = h - (Math.max(0, Math.min(100, y)) / 100) * h;
    return `${cx.toFixed(2)},${cy.toFixed(2)}`;
  };
  const linePath = `M ${projected.map(toCoords).join(" L ")}`;
  const areaPath = `${linePath} L ${w},${h} L 0,${h} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden
      {...rest}
    >
      <defs>
        <linearGradient id="orakly-spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--yes)" stopOpacity="0.42" />
          <stop offset="100%" stopColor="var(--yes)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#orakly-spark-fill)" />
      <path d={linePath} fill="none" stroke="var(--yes)" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
