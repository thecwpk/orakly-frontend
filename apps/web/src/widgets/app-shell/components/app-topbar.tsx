"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ROUTES } from "@/shared/constants/routes";
import { PrefetchLink } from "@/shared/ui";
import { useShowAdminNavLink } from "@/widgets/admin-dashboard/hooks/use-admin-nav-session";
import { cn } from "@/lib/utils";
import { AppSearch } from "./app-search";
import { NavTrendingTicker } from "./nav-trending-ticker";
import { NotificationBell } from "./notification-popover";
import { UserMenu } from "./user-menu";
import { WalletPopover } from "./wallet-popover";
import { useNavShortcuts } from "../lib/use-nav-shortcuts";

/** Light-colored mark for dark chrome; dark-colored mark for light chrome. */
const BRAND_LOGO_DARK_BG = "/brand/orakly-mark-light.svg";
const BRAND_LOGO_LIGHT_BG = "/brand/orakly-mark-dark.PNG";

/** Legacy PNG fallback if SVG missing. */
const BRAND_LOGO_PNG_FALLBACK = "/orakly-market-logo.png";

export type AppTopbarDensity = "default" | "hub";

/**
 * Compact terminal navbar — explore link, category picker, search, wallet,
 * notifications, profile; secondary destinations live in the profile menu and
 * mobile dock (`g` chord shortcuts unchanged).
 */
export function AppTopbar({ density = "default" }: { density?: AppTopbarDensity }) {
  useNavShortcuts();
  const hub = density === "hub";
  const [brandLogoFailed, setBrandLogoFailed] = useState(false);
  const [brandUsePngFallback, setBrandUsePngFallback] = useState(false);
  const { resolvedTheme } = useTheme();
  const [themeReady, setThemeReady] = useState(false);
  const showAdminNav = useShowAdminNavLink();

  useEffect(() => {
    setThemeReady(true);
  }, []);

  const brandSrc =
    !themeReady || resolvedTheme !== "light" ? BRAND_LOGO_DARK_BG : BRAND_LOGO_LIGHT_BG;

  const showTextFallback = brandLogoFailed;

  return (
    <header
      role="banner"
      data-topbar-density={density}
      className="relative sticky top-0 z-40 border-b border-app-subtle bg-app-chrome/97 backdrop-blur-sm supports-[backdrop-filter]:backdrop-blur-md chrome-edge-subtle"
    >
      <div
        className={cn(
          "flex h-[var(--app-topbar-row-h)] w-full items-center px-3 sm:px-4 lg:px-5",
          hub ? "gap-2" : "gap-2 sm:gap-3 lg:gap-4",
        )}
      >
        {/* Left — brand only */}
        <div className="flex min-w-0 shrink-0 items-center">
          <Link
            href={ROUTES.home}
            className="flex shrink-0 items-center gap-2.5 sm:gap-3"
            aria-label="Orakly Market home"
          >
            {!showTextFallback ? (
              <Image
                key={brandUsePngFallback ? "png" : `${themeReady ? resolvedTheme ?? "system" : "ssr"}-${brandSrc}`}
                src={brandUsePngFallback ? BRAND_LOGO_PNG_FALLBACK : brandSrc}
                alt="Orakly Market"
                width={180}
                height={40}
                priority
                className="h-7 w-auto max-w-[min(46vw,180px)] object-contain object-left sm:h-8 sm:max-w-[200px]"
                onError={() => {
                  if (!brandUsePngFallback) {
                    setBrandUsePngFallback(true);
                  } else {
                    setBrandLogoFailed(true);
                  }
                }}
              />
            ) : (
              <>
                <span className="gradient-ring relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0a0a10] ring-1 ring-white/[0.06]">
                  <span className="relative z-[1] font-mono text-[11px] font-bold tabular-nums text-yes">
                    O
                  </span>
                </span>
                <span className="hidden leading-none sm:flex sm:flex-col">
                  <span className="text-[13px] font-semibold tracking-tight text-zinc-100">Orakly</span>
                  <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    Market
                  </span>
                </span>
              </>
            )}
          </Link>
        </div>

        {/* Center — search grows */}
        <div className="min-w-0 flex-1 px-1 sm:px-2">
          <div
            className={cn(
              "mx-auto w-full min-w-0",
              hub ? "max-w-[420px]" : "max-w-xl lg:max-w-2xl",
            )}
          >
            <AppSearch />
          </div>
        </div>

        {/* Right — primary links (after search) · wallet · alerts · menu */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <nav className="hidden min-w-0 items-center gap-4 lg:gap-5 md:flex">
            <PrefetchLink
              href={ROUTES.marketsBrowse}
              className="shrink-0 text-[13px] font-medium text-zinc-400 transition hover:text-white"
            >
              Markets
            </PrefetchLink>
            <PrefetchLink
              href={ROUTES.portfolio}
              className="shrink-0 text-[13px] font-medium text-zinc-400 transition hover:text-white"
            >
              Portfolio
            </PrefetchLink>
            {showAdminNav ? (
              <PrefetchLink
                href={ROUTES.adminDashboard}
                className="shrink-0 text-[13px] font-medium text-zinc-400 transition hover:text-white"
              >
                Admin
              </PrefetchLink>
            ) : null}
          </nav>
          <span className="hidden h-4 w-px shrink-0 bg-white/[0.08] md:block" aria-hidden />
          <WalletPopover />
          <NotificationBell />
          <UserMenu />
        </div>
      </div>

      {/* Under-nav activity tape — hub markets ticker lives on `DappHubPage` (`.mb-ticker`). */}
      {!hub ? (
        <div className="hidden md:block">
          <NavTrendingTicker mode="activity" />
        </div>
      ) : null}
    </header>
  );
}
