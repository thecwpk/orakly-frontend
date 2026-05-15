"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BrandWordmarkLink } from "@/shared/ui";
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
    landing: { href: ROUTES.discover, isRoute: true },
    app: { href: ROUTES.discover, isRoute: true },
  },
  {
    label: "Dapp",
    landing: { href: ROUTES.dapp, isRoute: true },
    app: { href: ROUTES.dapp, isRoute: true },
  },
  {
    label: "Docs",
    landing: { href: "#footer", isRoute: false },
    app: { href: `${ROUTES.home}#footer`, isRoute: true },
  },
  {
    label: "Community",
    landing: { href: "#community", isRoute: false },
    app: { href: `${ROUTES.home}#community`, isRoute: true },
  },
  {
    label: "Help",
    landing: { href: "#early-access", isRoute: false },
    app: { href: `${ROUTES.home}#early-access`, isRoute: true },
  },
];

export type GlobalMarketingNavbarProps = {
  variant: "landing" | "app";
  appendActions?: ReactNode;
  /** Premium glass treatment for marketing hero (landing only). */
  chrome?: "default" | "glass";
};

export function GlobalMarketingNavbar({ variant, appendActions, chrome = "default" }: GlobalMarketingNavbarProps) {
  const [open, setOpen] = useState(false);
  const app = variant === "app";
  const glass = !app && chrome === "glass";

  const brandHref = ROUTES.home;
  const earlyHref = app ? `${ROUTES.home}#early-access` : "#early-access";

  const linkClass = glass
    ? "rounded-md px-1.5 py-1 text-[13px] font-medium text-[var(--text-muted)] transition hover:bg-[color-mix(in_srgb,var(--bg-3)_50%,transparent)] hover:text-[var(--text-primary)]"
    : "text-[13px] font-medium text-muted-foreground transition hover:text-foreground";

  const renderNavLink = (row: NavRow) => {
    const spec = app ? row.app : row.landing;
    const className = linkClass;
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
    const className = glass
      ? "rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:bg-[color-mix(in_srgb,var(--bg-3)_45%,transparent)] hover:text-[var(--text-primary)]"
      : "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground";
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
    <header
      className={cn(
        "sticky top-0 text-foreground",
        glass
          ? "z-[70] border-b border-[color:var(--border-soft)] bg-[color-mix(in_srgb,var(--bg-2)_78%,transparent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--bg-2)_65%,transparent)]"
          : "marketing-header-shell z-50 border-b border-border",
      )}
    >
      <div className="flex h-14 w-full max-w-none items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <BrandWordmarkLink href={brandHref} tone={glass ? "onDark" : "theme"} className="shrink-0" />

        <nav className="hidden items-center gap-6 lg:gap-8 md:flex">{NAV_ROWS.map(renderNavLink)}</nav>

        <div className="hidden items-center gap-2 sm:flex">
          <a
            href={earlyHref}
            className={cn(
              "rounded-md px-4 py-2 text-[13px] font-medium transition",
              glass
                ? "border border-[color:var(--border-soft)] bg-[color-mix(in_srgb,var(--bg-3)_40%,transparent)] text-[var(--text-primary)] hover:border-[color:var(--border-strong)] hover:bg-[color-mix(in_srgb,var(--bg-3)_55%,transparent)]"
                : "border border-border bg-card text-foreground hover:border-yes/25 hover:bg-yes/10",
            )}
          >
            Join Early Access
          </a>
          <Link
            href={ROUTES.dapp}
            className={cn(
              "rounded-md px-4 py-2 text-[13px] font-semibold transition",
              glass
                ? "bg-[var(--accent-strong)] text-[var(--bg-0)] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] hover:brightness-110"
                : "marketing-cta-primary shadow-[0_0_24px_-6px_color-mix(in_srgb,var(--yes)_35%,transparent)]",
            )}
          >
            Launch App
          </Link>
          {appendActions ? (
            <span
              className={cn(
                "ml-1 flex shrink-0 items-center gap-2 border-l pl-3",
                glass ? "border-[color:var(--border-soft)]" : "border-border",
              )}
            >
              {appendActions}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {appendActions ? <span className="flex shrink-0 items-center gap-1">{appendActions}</span> : null}
          <button
            type="button"
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg border text-foreground",
              glass
                ? "border-[color:var(--border-soft)] bg-[color-mix(in_srgb,var(--bg-3)_35%,transparent)] text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--bg-3)_50%,transparent)]"
                : "border-border",
            )}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "border-t md:hidden",
          glass ? "border-[color:var(--border-soft)] bg-[color-mix(in_srgb,var(--bg-1)_92%,transparent)] backdrop-blur-xl" : "border-border bg-background/90 backdrop-blur-md",
          open ? "block" : "hidden",
        )}
      >
        <nav className="flex w-full max-w-none flex-col gap-1 px-4 py-3">
          {NAV_ROWS.map((row) => renderMobileNavLink(row, () => setOpen(false)))}
          <div className={cn("mt-2 flex flex-col gap-2 border-t pt-3", glass ? "border-[color:var(--border-soft)]" : "border-border")}>
            <a
              href={earlyHref}
              className={cn(
                "rounded-md px-4 py-2.5 text-center text-sm font-medium",
                glass
                  ? "border border-[color:var(--border-soft)] bg-[color-mix(in_srgb,var(--bg-3)_40%,transparent)] text-[var(--text-primary)]"
                  : "border border-border text-foreground",
              )}
              onClick={() => setOpen(false)}
            >
              Join Early Access
            </a>
            <Link
              href={ROUTES.dapp}
              className={cn(
                "rounded-md py-2.5 text-center text-sm font-semibold",
                glass ? "bg-[var(--accent-strong)] text-[var(--bg-0)] hover:brightness-110" : "marketing-cta-primary",
              )}
              onClick={() => setOpen(false)}
            >
              Launch App
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
