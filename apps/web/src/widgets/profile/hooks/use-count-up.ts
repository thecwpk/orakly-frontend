"use client";

import { useEffect, useRef, useState } from "react";
import { useHydrationSafeReducedMotion } from "@/lib/use-hydration-safe-reduced-motion";

export type UseCountUpOptions = {
  /** Target value to animate to. */
  to: number;
  /** Animation duration in ms. */
  duration?: number;
  /** When `true`, animation is skipped and the value is set immediately. */
  disabled?: boolean;
  /** Optional easing function — defaults to `easeOutCubic`. */
  ease?: (t: number) => number;
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Animates a number from its previous value to `to` over `duration` using
 * `requestAnimationFrame`. Honors `prefers-reduced-motion` and snaps to the
 * target when the page is hidden so we don't render stale frames.
 */
export function useCountUp({
  to,
  duration = 800,
  disabled,
  ease = easeOutCubic,
}: UseCountUpOptions): number {
  const reduceMotion = useHydrationSafeReducedMotion();
  const [value, setValue] = useState<number>(disabled || reduceMotion ? to : 0);
  const fromRef = useRef<number>(value);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (disabled || reduceMotion) {
      setValue(to);
      return;
    }
    if (typeof document !== "undefined" && document.hidden) {
      setValue(to);
      return;
    }

    fromRef.current = value;
    startRef.current = null;

    const step = (ts: number) => {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const next = fromRef.current + (to - fromRef.current) * ease(t);
      setValue(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // We deliberately depend only on `to` — the count-up should restart when
    // the target changes, but not when intermediate values change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, duration, disabled, reduceMotion]);

  return value;
}
