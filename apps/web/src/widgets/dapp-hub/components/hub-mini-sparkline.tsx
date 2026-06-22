"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

/** Compact probability spark for hero trend rows. */
export function HubMiniSparkline({
  probability,
  className,
  width = 56,
  height = 28,
}: {
  probability: number;
  className?: string;
  width?: number;
  height?: number;
}) {
  const { linePath, areaPath } = useMemo(() => {
    const p = Math.min(0.99, Math.max(0.01, probability));
    const pts = [
      p * 0.88,
      p * 0.94,
      p * 0.91,
      p * 0.97,
      p,
    ];
    const padX = 2;
    const padY = 3;
    const innerW = width - padX * 2;
    const innerH = height - padY * 2;
    const lo = Math.min(...pts) - 0.04;
    const hi = Math.max(...pts) + 0.04;
    const denom = hi - lo || 1;

    const xy = pts.map((v, i) => {
      const x = padX + (pts.length > 1 ? (i / (pts.length - 1)) * innerW : innerW / 2);
      const t = (v - lo) / denom;
      const y = padY + (1 - t) * innerH;
      return { x, y };
    });

    const first = xy[0]!;
    let d = `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`;
    for (let i = 1; i < xy.length; i++) {
      const curr = xy[i]!;
      d += ` L ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
    }
    const last = xy[xy.length - 1]!;
    const baseY = padY + innerH;
    const area = `${d} L ${last.x.toFixed(1)} ${baseY.toFixed(1)} L ${first.x.toFixed(1)} ${baseY.toFixed(1)} Z`;
    return { linePath: d, areaPath: area };
  }, [probability, width, height]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("shrink-0", className)}
      width={width}
      height={height}
      aria-hidden
    >
      <path d={areaPath} fill="rgba(59, 130, 246, 0.12)" />
      <path
        d={linePath}
        fill="none"
        stroke="var(--hub-primary-bright)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
