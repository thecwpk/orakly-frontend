"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, Plus, Search, Shield, X } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ROUTES } from "@/shared/constants/routes";
import { BRAND_LOGO_NAV } from "@/shared/constants/brand-logos";
import { PrefetchLink } from "@/shared/ui";
import { cn } from "@/lib/utils";
import { useGlobalSearchStore } from "@/features/search";
import { useShowAdminNavLink } from "@/widgets/admin-dashboard/hooks/use-admin-nav-session";
import { NotificationBell } from "./notification-popover";
import { UserMenu } from "./user-menu";
import { WalletPopover } from "./wallet-popover";
import { useNavShortcuts } from "../lib/use-nav-shortcuts";
import {
  TOP_NAV_ITEMS,
  NARRATIVES_MENU_ITEMS,
  isNarrativesGroupActive,
  resolvePrimaryNavActive,
} from "../lib/nav-config";

const NAV_H = "h-14";
const NETWORK_LABEL = "BNB Testnet · 97";

function isMarketCreateActive(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === ROUTES.marketCreate ||
    pathname.startsWith(`${ROUTES.marketCreate}/`)
  );
}

function CreateMarketLink({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = isMarketCreateActive(pathname);

  return (
    <PrefetchLink
      href={ROUTES.marketCreate}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] px-3 text-[13px] font-medium transition-colors",
        focusRing(),
        active
          ? "bg-[var(--accent)]/12 text-[var(--foreground)] ring-1 ring-[var(--accent)]/25"
          : "text-[var(--foreground-muted)] hover:bg-white/[0.05] hover:text-[var(--foreground)]",
        className,
      )}
    >
      <Plus className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
      Create
    </PrefetchLink>
  );
}

function focusRing() {
  return "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-secondary)]";
}

function LogoMark({ onClick }: { onClick?: () => void }) {
  return (
    <PrefetchLink
      href={ROUTES.dapp}
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center rounded-[var(--radius-sm)]",
        focusRing(),
      )}
      aria-label="Orakly home"
    >
      <Image
        src={BRAND_LOGO_NAV}
        alt=""
        width={28}
        height={28}
        unoptimized
        priority
        className="h-7 w-7 object-contain"
      />
      <span
        className="ml-2 text-[15px] font-semibold tracking-tight text-[var(--foreground)]"
        style={{ fontFamily: "var(--font-display), var(--font-sans), system-ui" }}
      >
        Orakly
      </span>
      <span className="ml-2 rounded-[4px] border border-[var(--border)] bg-transparent px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.08em] text-[var(--foreground-muted)]">
        Beta
      </span>
    </PrefetchLink>
  );
}

function NavLink({
  href,
  label,
  active,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <PrefetchLink
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[13px] font-medium transition-colors",
        focusRing(),
        active
          ? "text-[var(--foreground)]"
          : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
      )}
    >
      {label}
      {active ? (
        <span
          className="absolute inset-x-2.5 -bottom-px h-px bg-[var(--accent)]"
          aria-hidden
        />
      ) : null}
    </PrefetchLink>
  );
}

function NarrativesMenu({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const pathname = usePathname();
  const active = isNarrativesGroupActive(pathname);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
        triggerRef.current?.focus();
      }
    };
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        panelRef.current?.contains(t) ||
        triggerRef.current?.contains(t)
      ) {
        return;
      }
      onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [open, onOpenChange]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={panelId}
        onClick={() => onOpenChange(!open)}
        className={cn(
          "relative inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[13px] font-medium transition-colors",
          focusRing(),
          active || open
            ? "text-[var(--foreground)]"
            : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
        )}
      >
        Narratives
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
        {active ? (
          <span
            className="absolute inset-x-2.5 -bottom-px h-px bg-[var(--accent)]"
            aria-hidden
          />
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            ref={panelRef}
            id={panelId}
            role="menu"
            aria-label="Narratives"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-[calc(100%+10px)] z-50 w-[min(100vw-2rem,20rem)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-secondary)] shadow-none"
          >
            <ul className="p-1.5">
              {NARRATIVES_MENU_ITEMS.map((item) => {
                const itemActive = item.isActive(pathname);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <PrefetchLink
                      href={item.href}
                      role="menuitem"
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        "flex items-start gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 transition-colors",
                        focusRing(),
                        itemActive
                          ? "bg-[var(--accent)]/10 text-[var(--foreground)]"
                          : "text-[var(--foreground-muted)] hover:bg-white/[0.03] hover:text-[var(--foreground)]",
                      )}
                    >
                      <Icon
                        className={cn(
                          "mt-0.5 size-4 shrink-0",
                          itemActive
                            ? "text-[var(--accent)]"
                            : "text-[var(--foreground-muted)]",
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0">
                        <span className="block text-[13px] font-medium text-[var(--foreground)]">
                          {item.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-[var(--foreground-muted)]">
                          {item.description}
                        </span>
                      </span>
                    </PrefetchLink>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SearchField({
  className,
  onActivate,
}: {
  className?: string;
  onActivate?: () => void;
}) {
  const openGlobalSearch = useGlobalSearchStore((s) => s.open);

  return (
    <button
      type="button"
      onClick={() => {
        onActivate?.();
        openGlobalSearch();
      }}
      className={cn(
        "group flex h-9 w-full min-w-0 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 text-left transition-colors",
        "hover:border-[var(--border-strong)]",
        focusRing(),
        className,
      )}
      aria-label="Search narratives or markets"
    >
      <Search
        className="size-3.5 shrink-0 text-[var(--foreground-muted)]"
        strokeWidth={2}
        aria-hidden
      />
      <span className="truncate text-[12.5px] text-[var(--foreground-muted)] group-hover:text-[var(--foreground)]/70">
        Search narratives or markets
      </span>
      <kbd className="ml-auto hidden rounded-[4px] border border-[var(--border)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--foreground-muted)] lg:inline">
        /
      </kbd>
    </button>
  );
}

function NetworkBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 shrink-0 items-center rounded-[var(--radius-sm)] border border-[var(--border)] px-2 text-[11px] font-medium text-[var(--foreground-muted)]",
        className,
      )}
      title="Connected network"
      aria-label="BNB Testnet, chain 97"
    >
      {NETWORK_LABEL}
    </span>
  );
}

/**
 * Product navbar — sticky surface bar with Narratives mega-menu,
 * search, network chip, and Connect Wallet.
 */
export function Navbar() {
  useNavShortcuts();
  const pathname = usePathname();
  const showAdminNav = useShowAdminNavLink();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [narrativesOpen, setNarrativesOpen] = useState(false);
  const openGlobalSearch = useGlobalSearchStore((s) => s.open);

  useEffect(() => {
    setDrawerOpen(false);
    setNarrativesOpen(false);
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
      className="fixed inset-x-0 top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background-secondary)]"
    >
      <div
        className={cn(
          "mx-auto flex max-w-7xl items-center gap-4 px-4 sm:px-6",
          NAV_H,
        )}
      >
        <div className="flex min-w-0 shrink-0 items-center">
          <LogoMark />
        </div>

        <nav
          className="hidden min-w-0 flex-1 items-center gap-0.5 md:flex"
          aria-label="Primary"
        >
          <NarrativesMenu
            open={narrativesOpen}
            onOpenChange={setNarrativesOpen}
          />
          {TOP_NAV_ITEMS.filter((item) => item.label !== "Narratives").map(
            (item) => {
              const active = resolvePrimaryNavActive(pathname, item);
              return (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  active={active}
                />
              );
            },
          )}
        </nav>

        <div className="ml-auto hidden shrink-0 items-center gap-2 lg:flex">
          <SearchField className="w-[min(100%,15rem)]" />
          <NetworkBadge className="hidden xl:inline-flex" />
          <NotificationBell />
          <CreateMarketLink />
          <UserMenu />
          <WalletPopover connectLabel="Connect Wallet" variant="default" />
        </div>

        <div className="ml-auto hidden shrink-0 items-center gap-2 md:flex lg:hidden">
          <button
            type="button"
            aria-label="Open search"
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]",
              focusRing(),
            )}
            onClick={() => openGlobalSearch()}
          >
            <Search className="size-[18px]" strokeWidth={2} aria-hidden />
          </button>
          <NetworkBadge />
          <CreateMarketLink className="hidden sm:inline-flex" />
          <UserMenu />
          <WalletPopover connectLabel="Connect Wallet" variant="default" />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 md:hidden">
          <button
            type="button"
            aria-label="Open search"
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]",
              focusRing(),
            )}
            onClick={() => openGlobalSearch()}
          >
            <Search className="size-[18px]" strokeWidth={2} aria-hidden />
          </button>
          <UserMenu />
          <WalletPopover connectLabel="Connect" variant="default" />
          <button
            type="button"
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            aria-expanded={drawerOpen}
            aria-controls="app-mobile-nav-drawer"
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]",
              focusRing(),
            )}
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
              className="absolute inset-0 bg-[var(--background)]/80"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              id="app-mobile-nav-drawer"
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ duration: 0.18 }}
              className="absolute inset-y-0 right-0 flex w-[min(100%,20rem)] flex-col border-l border-[var(--border)] bg-[var(--background-secondary)]"
            >
              <div
                className={cn(
                  "flex items-center justify-between border-b border-[var(--border)] px-4",
                  NAV_H,
                )}
              >
                <LogoMark onClick={() => setDrawerOpen(false)} />
                <button
                  type="button"
                  aria-label="Close menu"
                  className={cn(
                    "inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] text-[var(--foreground-muted)]",
                    focusRing(),
                  )}
                  onClick={() => setDrawerOpen(false)}
                >
                  <X className="size-[18px]" strokeWidth={2} aria-hidden />
                </button>
              </div>

              <div className="border-b border-[var(--border)] px-4 py-3">
                <SearchField onActivate={() => setDrawerOpen(false)} />
                <div className="mt-3 flex items-center justify-between gap-2">
                  <NetworkBadge />
                  <NotificationBell />
                </div>
              </div>

              <nav
                className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4"
                aria-label="Mobile primary"
              >
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
                  Narratives
                </p>
                {NARRATIVES_MENU_ITEMS.map((item) => {
                  const active = item.isActive(pathname);
                  return (
                    <PrefetchLink
                      key={item.href}
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] font-medium transition-colors",
                        focusRing(),
                        active
                          ? "bg-[var(--accent)]/10 text-[var(--foreground)]"
                          : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
                      )}
                    >
                      {item.label}
                      <span className="mt-0.5 block text-[11px] font-normal text-[var(--foreground-muted)]">
                        {item.description}
                      </span>
                    </PrefetchLink>
                  );
                })}

                <div className="my-3 border-t border-[var(--border)]" />

                {TOP_NAV_ITEMS.filter((item) => item.label !== "Narratives").map(
                  (item) => {
                    const active = resolvePrimaryNavActive(pathname, item);
                    return (
                      <PrefetchLink
                        key={item.href}
                        href={item.href}
                        onClick={() => setDrawerOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] font-medium transition-colors",
                          focusRing(),
                          active
                            ? "bg-[var(--accent)]/10 text-[var(--foreground)]"
                            : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
                        )}
                      >
                        {item.label}
                      </PrefetchLink>
                    );
                  },
                )}

                <div className="my-3 border-t border-[var(--border)]" />

                <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
                  Actions
                </p>
                <PrefetchLink
                  href={ROUTES.marketCreate}
                  onClick={() => setDrawerOpen(false)}
                  aria-current={isMarketCreateActive(pathname) ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] font-medium transition-colors",
                    focusRing(),
                    isMarketCreateActive(pathname)
                      ? "bg-[var(--accent)]/10 text-[var(--foreground)]"
                      : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
                  )}
                >
                  <Plus className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
                  Create market
                </PrefetchLink>
                {showAdminNav ? (
                  <PrefetchLink
                    href={ROUTES.adminDashboard}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] font-medium text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]",
                      focusRing(),
                    )}
                  >
                    <Shield className="size-4 shrink-0" aria-hidden />
                    Operator console
                  </PrefetchLink>
                ) : null}
              </nav>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

/** @deprecated Prefer `Navbar` — kept for AppShell import compatibility. */
export { Navbar as AppTopbar };
