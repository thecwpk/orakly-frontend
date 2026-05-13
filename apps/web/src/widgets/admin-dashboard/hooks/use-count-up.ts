"use client";

import { useEffect, useRef, useState } from "react";
import { useHydrationSafeReducedMotion } from "@/lib/use-hydration-safe-reduced-motion";

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** rAF-driven count-up that respects reduced motion + hidden documents. */
export function useCountUp(to: number, duration = 700): number {
  const reduceMotion = useHydrationSafeReducedMotion();
  const [value, setValue] = useState<number>(reduceMotion ? to : 0);
  const fromRef = useRef<number>(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduceMotion || (typeof document !== "undefined" && document.hidden)) {
      setValue(to);
      return;
    }
    fromRef.current = value;
    let start: number | null = null;
    const step = (ts: number) => {
      if (start == null) start = ts;
      const elapsed = ts - start;
      const t = Math.min(1, elapsed / duration);
      setValue(fromRef.current + (to - fromRef.current) * easeOutCubic(t));
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, duration, reduceMotion]);

  return value;
}
