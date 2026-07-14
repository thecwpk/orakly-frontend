"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, X } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ROUTES } from "@/shared/constants/routes";
import { BRAND_LOGO_NAV } from "@/shared/constants/brand-logos";
import { PrefetchLink } from "@/shared/ui";
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

const NAV_H = "h-14"; /* 56px */

function navLinkClass(active: boolean) {
  return cn(
    "rounded-md px-3 py-1.5 text-sm transition-colors",
    active
      ? "bg-white/10 text-white"
      : "text-[#94a3b8] hover:bg-white/5 hover:text-white",
  );
}

function iconBtnClass() {
  return cn(
    "inline-flex size-9 shrink-0 items-center justify-center rounded-md text-[#94a3b8] transition-colors",
    "hover:bg-white/5 hover:text-white",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35",
  );
}

function LogoMark({ onClick }: { onClick?: () => void }) {
  return (
    <PrefetchLink
      href={ROUTES.dapp}
      onClick={onClick}
      className="flex shrink-0 items-center"
      aria-label="Orakly home"
    >
      <Image
        src={BRAND_LOGO_NAV}
        alt=""
        width={32}
        height={32}
        unoptimized
        priority
        className="h-8 w-8 object-contain"
      />
      <span className="ml-2 text-base font-bold text-white">Orakly</span>
      <span className="ml-2 rounded bg-[var(--accent)] px-1.5 py-0.5 text-[6px] font-semibold uppercase leading-none tracking-wide text-white">
        Beta
      </span>
    </PrefetchLink>
  );
}

/**
 * Fixed top navigation — logo, 6 primary links, search / bell / wallet.
 */
export function AppTopbar({ density = "default" }: { density?: AppTopbarDensity }) {
  useNavShortcuts();
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
      className="fixed inset-x-0 top-0 z-50 w-full border-b border-white/5 bg-[#0f1117]/90 backdrop-blur-xl"
    >
      <div
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between px-4",
          NAV_H,
        )}
      >
        {/* LEFT — logo + BETA */}
        <div className="flex min-w-0 shrink-0 items-center">
          <LogoMark />
        </div>

        {/* CENTER — desktop primary links */}
        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 md:flex"
          aria-label="Primary"
        >
          {TOP_NAV_ITEMS.map((item) => {
            const active = resolvePrimaryNavActive(pathname, item);
            return (
              <PrefetchLink
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={navLinkClass(active)}
              >
                {item.label}
              </PrefetchLink>
            );
          })}
        </nav>

        {/* RIGHT — desktop actions */}
        <div className="hidden shrink-0 items-center gap-1.5 md:flex">
          <button
            type="button"
            aria-label="Open search"
            className={iconBtnClass()}
            onClick={() => openGlobalSearch()}
          >
            <Search className="size-[18px]" strokeWidth={2} aria-hidden />
          </button>
          <NotificationBell />
          <WalletPopover connectLabel="Connect Wallet" variant="default" />
        </div>

        {/* MOBILE — connect + hamburger */}
        <div className="flex shrink-0 items-center gap-1.5 md:hidden">
          <WalletPopover connectLabel="Connect Wallet" variant="default" />
          <button
            type="button"
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            aria-expanded={drawerOpen}
            aria-controls="app-mobile-nav-drawer"
            className={iconBtnClass()}
            onClick={() => setDrawerOpen((v) => !v)}
          >
            {drawerOpen ? (
              <X className="size-[18px]" strokeWidth={2} aria-hidden />
            ) : (
              <Menu className="size-[18px]" strokeWidth={2} aria-hidden />
            )}
          </button>
        </div>
      </div>

      {/* Mobile full-screen drawer */}
      <AnimatePresence>
        {drawerOpen ? (
          <div
            className="fixed inset-0 z-[60] md:hidden"
            aria-modal="true"
            role="dialog"
            aria-label="Navigation menu"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-[#0f1117]"
            />
            <motion.div
              id="app-mobile-nav-drawer"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="relative flex h-full flex-col"
            >
              <div className={cn("flex items-center justify-between border-b border-white/5 px-4", NAV_H)}>
                <LogoMark onClick={() => setDrawerOpen(false)} />
                <button
                  type="button"
                  aria-label="Close menu"
                  className={iconBtnClass()}
                  onClick={() => setDrawerOpen(false)}
                >
                  <X className="size-[18px]" strokeWidth={2} aria-hidden />
                </button>
              </div>

              <nav
                className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-6"
                aria-label="Mobile primary"
              >
                {TOP_NAV_ITEMS.map((item) => {
                  const active = resolvePrimaryNavActive(pathname, item);
                  return (
                    <PrefetchLink
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setDrawerOpen(false)}
                      className={cn(navLinkClass(active), "px-4 py-3 text-base")}
                    >
                      {item.label}
                    </PrefetchLink>
                  );
                })}

                <div className="mt-6 space-y-2 border-t border-white/5 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false);
                      openGlobalSearch();
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-4 py-3 text-left text-base text-[#94a3b8] transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <Search className="size-[18px] shrink-0" aria-hidden />
                    Search
                  </button>
                  <div className="flex items-center gap-2 px-4 py-2">
                    <NotificationBell />
                    <span className="text-sm text-[#94a3b8]">Notifications</span>
                  </div>
                </div>
              </nav>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
