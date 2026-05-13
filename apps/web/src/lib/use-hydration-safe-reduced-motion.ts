"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * `useReducedMotion()` reads `matchMedia`, which is unavailable during SSR and may
 * resolve differently on the client's first paint — changing Framer Motion `initial`
 * props and causing hydration mismatches. Until mount, we assume reduced motion is off
 * so server HTML matches the first client render.
 */
export function useHydrationSafeReducedMotion(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const prefersReduced = useReducedMotion();
  if (!mounted) return false;
  return Boolean(prefersReduced);
}
