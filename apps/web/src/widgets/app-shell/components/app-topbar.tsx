"use client";

import { ROUTES } from "@/shared/constants/routes";
import { BrandWordmarkLink, PrefetchLink } from "@/shared/ui";
import { useShowAdminNavLink } from "@/widgets/admin-dashboard/hooks/use-admin-nav-session";
import { cn } from "@/lib/utils";
import { AppSearch } from "./app-search";
import { NavTrendingTicker } from "./nav-trending-ticker";
import { NotificationBell } from "./notification-popover";
import { UserMenu } from "./user-menu";
import { WalletPopover } from "./wallet-popover";
import { useNavShortcuts } from "../lib/use-nav-shortcuts";

export type AppTopbarDensity = "default" | "hub";

/**
 * Compact terminal navbar — explore link, category picker, search, wallet,
 * notifications, profile; secondary destinations live in the profile menu and
 * mobile dock (`g` chord shortcuts unchanged).
 */
export function AppTopbar({ density = "default" }: { density?: AppTopbarDensity }) {
  useNavShortcuts();
  const hub = density === "hub";
  const showAdminNav = useShowAdminNavLink();

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
        <div className="flex min-w-0 shrink-0 items-center">
          <BrandWordmarkLink
            href={ROUTES.dapp}
            tone="theme"
            priority
            className="gap-2.5 sm:gap-3"
            imgClassName="h-7 max-w-[min(46vw,180px)] sm:h-8 sm:max-w-[200px]"
          />
        </div>

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

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <nav className="hidden min-w-0 items-center gap-4 lg:gap-5 md:flex">
            <PrefetchLink
              href={ROUTES.discover}
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

      {!hub ? (
        <div className="hidden md:block">
          <NavTrendingTicker mode="activity" />
        </div>
      ) : null}
    </header>
  );
}
