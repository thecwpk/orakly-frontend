"use client";

import { motion } from "framer-motion";
import { MoreHorizontal } from "lucide-react";
import { PrefetchLink } from "@/shared/ui";
import { usePathname, useSearchParams } from "next/navigation";
import { useAppShellStore } from "../store/use-app-shell-store";
import { MOBILE_DOCK_ITEMS, resolvePrimaryNavActive } from "../lib/nav-config";
import { cn } from "@/lib/utils";

/**
 * Mobile bottom dock — primary nav for phones.
 *
 * Hard requirements (touch UX):
 *   - Each tap target is ≥48dp tall (Material) / ≥44pt (Apple HIG)
 *   - Honors safe-area inset for home-indicator devices
 *   - `active:scale` for tactile press feedback (no hover on touch)
 *   - Active route gets a shared `layoutId` indicator so the line glides
 *
 * Hidden `lg+` — wide screens use top chrome only (`MobileBottomNav` is `lg:hidden`).
 */
export function MobileBottomNav({
  /** Hub layout: “Markets” dock tile opens `/discover` instead of `/markets?trending=0`. */
  marketsDirectoryHref,
}: {
  marketsDirectoryHref?: string;
} = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const setMoreOpen = useAppShellStore((s) => s.setMobileMoreMenuOpen);

  return (
    <nav
      aria-label="Primary mobile navigation"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 lg:hidden",
        "rounded-t-xl border border-white/[0.06] border-b-0 bg-app-chrome/98 backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-xl",
        "shadow-[0_-8px_32px_rgba(0,0,0,0.45)]",
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <ul className="grid grid-cols-6">
        {MOBILE_DOCK_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = resolvePrimaryNavActive(
            pathname,
            item,
            searchParams,
          );
          const href =
            marketsDirectoryHref && item.marketsBrowse ? marketsDirectoryHref : item.href;
          return (
            <li key={`${item.label}-${href}`} className="contents">
              <PrefetchLink
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[10px] font-medium tracking-wide transition-colors",
                  "active:scale-[0.97] active:bg-white/[0.04]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/30",
                  active
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-200",
                )}
              >
                <span
                  className={cn(
                    "relative inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors",
                    active ? "bg-cyan-500/12" : "bg-transparent",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px]",
                      active ? "text-cyan-300" : "text-current",
                    )}
                  />
                </span>
                <span className="leading-none">{item.label}</span>
                {active ? (
                  <motion.span
                    layoutId="mobile-active-indicator"
                    className="absolute inset-x-8 top-0 h-0.5 rounded-full bg-emerald-500/85"
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
        <li className="contents">
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label="More navigation"
            className={cn(
              "flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[10px] font-medium tracking-wide text-zinc-500 transition-colors",
              "active:scale-[0.97] active:bg-white/[0.04]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/30",
              "hover:text-zinc-200",
            )}
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md">
              <MoreHorizontal className="h-[18px] w-[18px]" />
            </span>
            <span className="leading-none">More</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
