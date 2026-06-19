"use client";

import { motion } from "framer-motion";
import { PrefetchLink } from "@/shared/ui";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MOBILE_DOCK_ITEMS, resolvePrimaryNavActive } from "../lib/nav-config";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";

/**
 * Mobile bottom dock — Home, Markets, Attention, Portfolio, Profile.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hubLight =
    pathname === ROUTES.dapp ||
    pathname?.startsWith(`${ROUTES.dapp}/`) ||
    pathname === ROUTES.attention;
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
        "rounded-t-2xl border border-b-0 pb-[env(safe-area-inset-bottom)]",
        hubLight
          ? "border-[var(--hub-border)] bg-white/98 shadow-[0_-2px_16px_rgb(17_24_39_/_0.06)] backdrop-blur-md"
          : "border-[rgba(96,165,250,0.16)] bg-[hsl(215_40%_11%/_0.98)] shadow-[0_-4px_24px_rgba(15,40,80,0.45)] backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-xl",
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
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]/35",
                  hubLight
                    ? active
                      ? "text-[var(--hub-fg)]"
                      : "text-[var(--hub-muted)] hover:text-[var(--hub-fg)]"
                    : active
                      ? "text-[#f0f6ff]"
                      : "text-[#8ba3c7] hover:text-[#f0f6ff]",
                )}
              >
                <span
                  className={cn(
                    "relative inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors",
                    hubLight
                      ? active
                        ? "bg-[var(--hub-primary-soft)]"
                        : "bg-transparent"
                      : active
                        ? "bg-[#3b82f6]/15"
                        : "bg-transparent",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px]",
                      hubLight
                        ? active
                          ? "text-[var(--hub-primary)]"
                          : "text-current"
                        : active
                          ? "text-[#60a5fa]"
                          : "text-current",
                    )}
                  />
                </span>
                <span className="leading-none">{item.label}</span>
                {active ? (
                  <motion.span
                    layoutId="mobile-active-indicator"
                    className={cn(
                      "absolute inset-x-6 top-0 h-0.5 rounded-full",
                      hubLight ? "bg-[var(--hub-fg)]" : "bg-[#3b82f6]",
                    )}
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
