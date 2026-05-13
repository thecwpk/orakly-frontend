"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/shared/constants/routes";
type NavRow = {
  label: string;
  landing: { href: string; isRoute: boolean };
  app: { href: string; isRoute: boolean };
};

const NAV_ROWS: NavRow[] = [
  { label: "Discover", landing: { href: ROUTES.discover, isRoute: true }, app: { href: ROUTES.discover, isRoute: true } },
  {
    label: "Markets",
    landing: { href: "#markets-preview", isRoute: false },
    app: { href: ROUTES.marketsBrowse, isRoute: true },
  },
  { label: "Dapp", landing: { href: "#how-it-works", isRoute: false }, app: { href: ROUTES.home, isRoute: true } },
  {
    label: "Docs",
    landing: { href: "#footer", isRoute: false },
    app: { href: `${ROUTES.welcome}#footer`, isRoute: true },
  },
  {
    label: "Community",
    landing: { href: "#community", isRoute: false },
    app: { href: `${ROUTES.welcome}#community`, isRoute: true },
  },
  {
    label: "Help",
    landing: { href: "#early-access", isRoute: false },
    app: { href: `${ROUTES.welcome}#early-access`, isRoute: true },
  },
];

export type GlobalMarketingNavbarProps = {
  variant: "landing" | "app";
  appendActions?: ReactNode;
};

export function GlobalMarketingNavbar({ variant, appendActions }: GlobalMarketingNavbarProps) {
  const [open, setOpen] = useState(false);
  const app = variant === "app";

  const brandHref = app ? ROUTES.home : ROUTES.welcome;
  const earlyHref = app ? `${ROUTES.welcome}#early-access` : "#early-access";

  const renderNavLink = (row: NavRow) => {
    const spec = app ? row.app : row.landing;
    const className =
      "text-[13px] font-medium text-muted-foreground transition hover:text-foreground";
    if (spec.isRoute) {
      return (
        <Link key={row.label} href={spec.href} className={className}>
          {row.label}
        </Link>
      );
    }
    return (
      <a key={row.label} href={spec.href} className={className}>
        {row.label}
      </a>
    );
  };

  const renderMobileNavLink = (row: NavRow, onNavigate: () => void) => {
    const spec = app ? row.app : row.landing;
    const className =
      "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground";
    if (spec.isRoute) {
      return (
        <Link key={row.label} href={spec.href} className={className} onClick={onNavigate}>
          {row.label}
        </Link>
      );
    }
    return (
      <a key={row.label} href={spec.href} className={className} onClick={onNavigate}>
        {row.label}
      </a>
    );
  };

  return (
    <header className="marketing-header-shell sticky top-0 z-50 border-b border-border text-foreground">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <Link href={brandHref} className="shrink-0 font-semibold tracking-tight text-foreground transition hover:text-yes/90">
          Orakly
        </Link>

        <nav className="hidden items-center gap-6 lg:gap-8 md:flex">{NAV_ROWS.map(renderNavLink)}</nav>

        <div className="hidden items-center gap-2 sm:flex">
          <a
            href={earlyHref}
            className="rounded-full border border-border bg-card px-4 py-2 text-[13px] font-medium text-foreground transition hover:border-yes/25 hover:bg-yes/10"
          >
            Join Early Access
          </a>
          <Link
            href={ROUTES.markets}
            className="marketing-cta-primary px-4 py-2 text-[13px] shadow-[0_0_24px_-6px_color-mix(in_srgb,var(--yes)_35%,transparent)]"
          >
            Launch App
          </Link>
          {appendActions ? (
            <span className="ml-1 flex shrink-0 items-center gap-2 border-l border-border pl-3">{appendActions}</span>
          ) : null}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {appendActions ? <span className="flex shrink-0 items-center gap-1">{appendActions}</span> : null}
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border text-foreground"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <div className={cn("border-t border-border bg-background/90 backdrop-blur-md md:hidden", open ? "block" : "hidden")}>
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
          {NAV_ROWS.map((row) => renderMobileNavLink(row, () => setOpen(false)))}
          <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
            <a
              href={earlyHref}
              className="rounded-full border border-border px-4 py-2.5 text-center text-sm font-medium text-foreground"
              onClick={() => setOpen(false)}
            >
              Join Early Access
            </a>
            <Link href={ROUTES.markets} className="marketing-cta-primary py-2.5 text-center text-sm" onClick={() => setOpen(false)}>
              Launch App
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
