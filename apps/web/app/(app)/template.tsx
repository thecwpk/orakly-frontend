"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { useHydrationSafeReducedMotion } from "@/lib/use-hydration-safe-reduced-motion";

/**
 * Premium route transitions.
 *
 * The component re-mounts on every navigation (pathname `key`) so React tears
 * the previous tree down and brings the new one up under a soft enter. We
 * also:
 *
 *   1. **Reset scroll** on the inner `#app-content` main when the path
 *      changes. Next's default scroll restoration assumes the document
 *      scrolls — but our app shell uses an inner main scroll container, so
 *      the browser's scroll memory is wrong on hash-less navigations.
 *   2. Honor `prefers-reduced-motion` (Framer's `MotionConfig` already covers
 *      most components; this is a defensive fallback for SSR-first paint).
 *   3. Use a tight enter (180ms) — long enough to feel intentional, short
 *      enough that power-users don't notice it slowing them down.
 */
export default function AppRouteTemplate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useHydrationSafeReducedMotion();
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    if (prevPath.current !== null && prevPath.current !== pathname) {
      const main = document.getElementById("app-content");
      if (main) main.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      else window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
    prevPath.current = pathname;
  }, [pathname]);

  if (reduceMotion) {
    return <div className="min-h-0 flex-1">{children}</div>;
  }

  return (
    <motion.div
      key={pathname}
      className="min-h-0 flex-1 [contain:layout_paint] will-change-[opacity,transform]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
