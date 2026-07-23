"use client";

import { useEffect, useRef, useState } from "react";

type HubCountUpProps = {
  value: number;
  durationMs?: number;
  formatter?: (n: number) => string;
  className?: string;
};

/** Animated number for live desk stats. */
export function HubCountUp({
  value,
  durationMs = 1200,
  formatter = (n) => Math.round(n).toLocaleString("en-US"),
  className,
}: HubCountUpProps) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = Number.isFinite(value) ? value : 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      const next = from + (to - from) * eased;
      setDisplay(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, durationMs]);

  return <span className={className}>{formatter(display)}</span>;
}
