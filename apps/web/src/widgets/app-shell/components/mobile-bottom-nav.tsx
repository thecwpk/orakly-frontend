"use client";

import { motion } from "framer-motion";
import { PrefetchLink } from "@/shared/ui";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MOBILE_DOCK_ITEMS, resolvePrimaryNavActive } from "../lib/nav-config";
import { cn } from "@/lib/utils";

/**
 * Mobile bottom dock — Home, Markets, Attention, Portfolio, Profile.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, bump] = useState(0);

  useEffect(() => {
    const onHash = () => bump((n) => n + 1);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <nav
      aria-label="Primary mobile navigation"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 lg:hidden",
        "rounded-t-2xl border border-[#1d1d1d] border-b-0 bg-[#090909]/98 backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-xl",
        "shadow-[0_-4px_24px_rgba(0,0,0,0.4)]",
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <ul className="grid grid-cols-5">
        {MOBILE_DOCK_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = resolvePrimaryNavActive(pathname, item, searchParams);
          return (
            <li key={`${item.label}-${item.href}`} className="contents">
              <PrefetchLink
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[10px] font-medium tracking-wide transition-colors",
                  "active:scale-[0.97] active:bg-white/[0.04]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]/30",
                  active ? "text-[#f5f5f5]" : "text-[#9ca3af] hover:text-[#f5f5f5]",
                )}
              >
                <span
                  className={cn(
                    "relative inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors",
                    active ? "bg-[#22c55e]/12" : "bg-transparent",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px]",
                      active ? "text-[#22c55e]" : "text-current",
                    )}
                  />
                </span>
                <span className="leading-none">{item.label}</span>
                {active ? (
                  <motion.span
                    layoutId="mobile-active-indicator"
                    className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-[#22c55e]"
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 32,
                    }}
                  />
                ) : null}
              </PrefetchLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
