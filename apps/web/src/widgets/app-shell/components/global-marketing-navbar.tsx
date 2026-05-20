"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BrandWordmarkLink } from "@/shared/ui";
import { ROUTES } from "@/shared/constants/routes";
import { landingShell } from "@/widgets/landing/sections/marketing-landing-rail";

type NavRow = {
  label: string;
  landing: { href: string; isRoute: boolean };
  app: { href: string; isRoute: boolean };
};

const NAV_ROWS: NavRow[] = [
  {
    label: "Markets",
    landing: { href: "#live-markets", isRoute: false },
    app: { href: ROUTES.discover, isRoute: true },
  },
  {
    label: "How it works",
    landing: { href: "#how-it-works", isRoute: false },
    app: { href: `${ROUTES.home}#how-it-works`, isRoute: true },
  },
  {
    label: "Roadmap",
    landing: { href: "#roadmap", isRoute: false },
    app: { href: `${ROUTES.home}#roadmap`, isRoute: true },
  },
  {
    label: "FAQ",
    landing: { href: "#faq", isRoute: false },
    app: { href: `${ROUTES.home}#faq`, isRoute: true },
  },
];

export type GlobalMarketingNavbarProps = {
  variant: "landing" | "app";
  appendActions?: ReactNode;
  chrome?: "default" | "glass";
};

export function GlobalMarketingNavbar({ variant, appendActions, chrome = "default" }: GlobalMarketingNavbarProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const app = variant === "app";
  const glass = !app && chrome === "glass";

  useEffect(() => {
    if (app) return;
    const onScroll = () => setScrolled(window.scrollY > 64);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [app]);

  const navLinkClass = cn(
    "marketing-nav-link rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-200",
    glass
      ? "text-[var(--text-muted)] hover:bg-white/[0.06] hover:text-[var(--text-primary)]"
      : "text-slate-300/90 hover:bg-sky-500/[0.08] hover:text-white",
  );

  const renderNavLink = (row: NavRow) => {
    const spec = app ? row.app : row.landing;
    if (spec.isRoute) {
      return (
        <Link key={row.label} href={spec.href} className={navLinkClass}>
          {row.label}
        </Link>
      );
    }
    return (
      <a key={row.label} href={spec.href} className={navLinkClass}>
        {row.label}
      </a>
    );
  };

  const renderMobileNavLink = (row: NavRow, onNavigate: () => void) => {
    const spec = app ? row.app : row.landing;
    const className = cn(
      "rounded-xl px-3 py-2.5 text-sm font-medium transition",
      glass
        ? "text-[var(--text-muted)] hover:bg-white/[0.06] hover:text-[var(--text-primary)]"
        : "text-slate-300 hover:bg-sky-500/[0.08] hover:text-white",
    );
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
      data-scrolled={!app && scrolled ? "true" : undefined}
      className={cn(
        "marketing-nav-shell sticky top-0 z-50 text-foreground transition-[box-shadow,backdrop-filter] duration-300",
        glass
          ? "z-[70] border-b border-[color:var(--border-soft)] bg-[color-mix(in_srgb,var(--bg-2)_78%,transparent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--bg-2)_65%,transparent)]"
          : "marketing-header-shell",
        !app && scrolled && "shadow-[0_12px_40px_-16px_rgba(8,20,48,0.55)]",
      )}
    >
      <div
        className={cn(
          landingShell,
          "relative flex items-center justify-between gap-3 transition-[height] duration-200 sm:gap-4",
          !app && scrolled ? "h-[3.25rem]" : "h-14 sm:h-[3.75rem]",
        )}
      >
        <BrandWordmarkLink
          href={ROUTES.home}
          showTitle
          variant="nav"
          priority
          className="relative z-[2] min-w-0 shrink-0"
        />

        <nav
          className="absolute left-1/2 z-[1] hidden -translate-x-1/2 items-center gap-0.5 rounded-full border border-white/[0.06] bg-white/[0.03] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md md:flex"
          aria-label="Primary"
        >
          {NAV_ROWS.map(renderNavLink)}
        </nav>

        <div className="relative z-[2] ml-auto flex items-center gap-2 sm:gap-2.5">
          <Link href={ROUTES.signIn} className="marketing-nav-signin hidden sm:inline-flex">
            Sign in
          </Link>
          <Link href={ROUTES.dapp} className="marketing-nav-cta hidden sm:inline-flex">
            Launch app
          </Link>
          {appendActions ? (
            <span className="ml-0.5 flex shrink-0 items-center gap-2 border-l border-white/[0.08] pl-2.5 sm:pl-3">
              {appendActions}
            </span>
          ) : null}
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-sky-500/15 bg-sky-500/[0.06] text-foreground transition hover:border-sky-400/30 hover:bg-sky-500/10 md:hidden"
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
          "border-t border-sky-500/10 bg-[hsl(225_32%_11%_/_0.95)] backdrop-blur-xl md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav className={cn(landingShell, "flex flex-col gap-1 py-3")} aria-label="Mobile primary">
          {NAV_ROWS.map((row) => renderMobileNavLink(row, () => setOpen(false)))}
          <div className="mt-2 flex flex-col gap-2 border-t border-white/[0.06] pt-3">
            <Link
              href={ROUTES.signIn}
              className="marketing-nav-signin justify-center py-2.5"
              onClick={() => setOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href={ROUTES.dapp}
              className="marketing-nav-cta justify-center py-2.5"
              onClick={() => setOpen(false)}
            >
              Launch app
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
