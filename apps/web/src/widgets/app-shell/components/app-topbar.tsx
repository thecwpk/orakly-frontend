"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ROUTES } from "@/shared/constants/routes";
import { BrandWordmarkLink, PrefetchLink } from "@/shared/ui";
import { cn } from "@/lib/utils";
import { NotificationBell } from "./notification-popover";
import { WalletPopover } from "./wallet-popover";
import { useGlobalSearchStore } from "@/features/search";
import { useNavShortcuts } from "../lib/use-nav-shortcuts";
import {
  TOP_NAV_ITEMS,
  resolvePrimaryNavActive,
} from "../lib/nav-config";

export type AppTopbarDensity = "default" | "hub";

function navLinkClass(active: boolean, hub: boolean) {
  return cn(
    "relative shrink-0 pb-0.5 text-[13px] font-medium transition",
    hub
      ? active
        ? "font-semibold text-[var(--hub-primary)]"
        : "text-[var(--hub-muted)] hover:text-[var(--hub-fg)]"
      : active
        ? "text-[#f0f6ff]"
        : "text-[#8ba3c7] hover:text-[#f0f6ff]",
    active &&
      (hub
        ? "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-[var(--hub-primary)]"
        : "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-[#60a5fa]"),
  );
}

function iconBtnClass(hub: boolean) {
  return cn(
    "relative inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] border transition",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/35",
    hub
      ? "border-[var(--hub-border)] bg-[color-mix(in_srgb,var(--hub-card)_70%,transparent)] text-[var(--hub-muted)] hover:border-[var(--hub-border-strong)] hover:text-[var(--hub-fg)]"
      : "border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:border-white/[0.11] hover:bg-white/[0.06] hover:text-zinc-100",
  );
}

/**
 * Sticky terminal navbar — logo + primary nav, search / notifications / wallet.
 */
export function AppTopbar({ density = "default" }: { density?: AppTopbarDensity }) {
  useNavShortcuts();
  const hub = density === "hub";
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openGlobalSearch = useGlobalSearchStore((s) => s.open);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  return (
    <header
      role="banner"
      data-topbar-density={density}
      className={cn(
        "relative sticky top-0 z-40 border-b backdrop-blur-sm supports-[backdrop-filter]:backdrop-blur-md",
        hub
          ? "border-[var(--hub-border)] bg-[var(--hub-chrome)]/95"
          : "border-app-subtle bg-app-chrome/97 chrome-edge-subtle",
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-[var(--app-topbar-row-h)] w-full max-w-[90rem] items-center px-3 sm:px-4 lg:px-6",
          hub ? "gap-3" : "gap-2 sm:gap-3 lg:gap-4",
        )}
      >
        {/* Left — logo always → /dapp */}
        <BrandWordmarkLink
          href={ROUTES.dapp}
          showTitle={false}
          variant="nav"
          tone="onDark"
          priority
          className="min-w-0 shrink-0"
        />

        {/* Center — desktop primary links */}
        <nav
          className="ml-5 hidden min-w-0 flex-1 items-center gap-4 md:flex lg:gap-5"
          aria-label="Primary"
        >
          {TOP_NAV_ITEMS.map((item) => {
            const active = resolvePrimaryNavActive(pathname, item);
            return (
              <PrefetchLink
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={navLinkClass(active, hub)}
              >
                {item.label}
              </PrefetchLink>
            );
          })}
        </nav>

        <div className="flex-1 md:hidden" aria-hidden />

        {/* Right — desktop actions */}
        <div className="hidden shrink-0 items-center gap-2 sm:gap-2.5 md:ml-auto md:flex">
          <button
            type="button"
            aria-label="Open search"
            className={iconBtnClass(hub)}
            onClick={() => openGlobalSearch()}
          >
            <Search className="size-[18px]" strokeWidth={2} aria-hidden />
          </button>
          <NotificationBell />
          <WalletPopover connectLabel="Connect Wallet" variant={hub ? "hub" : "default"} />
        </div>

        {/* Mobile — hamburger top right */}
        <button
          type="button"
          aria-label={drawerOpen ? "Close menu" : "Open menu"}
          aria-expanded={drawerOpen}
          aria-controls="app-mobile-nav-drawer"
          className={cn(iconBtnClass(hub), "md:hidden")}
          onClick={() => setDrawerOpen((v) => !v)}
        >
          {drawerOpen ? (
            <X className="size-[18px]" strokeWidth={2} aria-hidden />
          ) : (
            <Menu className="size-[18px]" strokeWidth={2} aria-hidden />
          )}
        </button>
      </div>

      {/* Mobile drawer — slides in from left */}
      <AnimatePresence>
        {drawerOpen ? (
          <div
            className="fixed inset-0 z-[45] md:hidden"
            aria-modal="true"
            role="dialog"
            aria-label="Navigation menu"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              id="app-mobile-nav-drawer"
              initial={{ x: "-105%" }}
              animate={{ x: 0 }}
              exit={{ x: "-105%" }}
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
              className={cn(
                "absolute inset-y-0 left-0 flex w-[min(100vw-3rem,20rem)] flex-col border-r",
                hub
                  ? "border-[var(--hub-border)] bg-[var(--hub-chrome)]"
                  : "border-white/[0.08] bg-[#0b0b14]",
              )}
            >
              <div className="flex h-[var(--app-topbar-row-h)] items-center justify-between border-b border-white/[0.06] px-3">
                <BrandWordmarkLink
                  href={ROUTES.dapp}
                  showTitle={false}
                  variant="nav"
                  tone="onDark"
                  onClick={() => setDrawerOpen(false)}
                />
                <button
                  type="button"
                  aria-label="Close menu"
                  className={iconBtnClass(hub)}
                  onClick={() => setDrawerOpen(false)}
                >
                  <X className="size-[18px]" strokeWidth={2} aria-hidden />
                </button>
              </div>

              <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3" aria-label="Mobile primary">
                {TOP_NAV_ITEMS.map((item) => {
                  const active = resolvePrimaryNavActive(pathname, item);
                  return (
                    <PrefetchLink
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setDrawerOpen(false)}
                      className={cn(
                        "rounded-lg px-3 py-2.5 text-[14px] font-medium transition",
                        active
                          ? hub
                            ? "bg-[var(--hub-primary)]/12 text-[var(--hub-primary)]"
                            : "bg-white/[0.06] text-white ring-1 ring-cyan-400/25"
                          : hub
                            ? "text-[var(--hub-muted)] hover:bg-white/[0.04] hover:text-[var(--hub-fg)]"
                            : "text-zinc-300 hover:bg-white/[0.04] hover:text-white",
                      )}
                    >
                      {item.label}
                    </PrefetchLink>
                  );
                })}

                <div className="mt-3 space-y-2 border-t border-white/[0.06] px-1 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false);
                      openGlobalSearch();
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[14px] font-medium transition",
                      hub
                        ? "text-[var(--hub-muted)] hover:bg-white/[0.04] hover:text-[var(--hub-fg)]"
                        : "text-zinc-300 hover:bg-white/[0.04] hover:text-white",
                    )}
                  >
                    <Search className="size-4 shrink-0" aria-hidden />
                    Search
                  </button>
                  <div className="flex items-center gap-2 px-1 pt-1">
                    <NotificationBell />
                    <span className="text-[12px] text-zinc-400">Notifications</span>
                  </div>
                </div>
              </nav>

              <div className="border-t border-white/[0.06] p-3">
                <WalletPopover
                  connectLabel="Connect Wallet"
                  variant={hub ? "hub" : "default"}
                />
              </div>
            </motion.aside>
          </div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
