"use client";

import { usePathname } from "next/navigation";
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
import { isHubHomeActive, isAttentionAnchorActive } from "../lib/nav-config";

export type AppTopbarDensity = "default" | "hub";

type TopNavItem = {
  href: string;
  label: string;
  kind: "home" | "markets" | "attention" | "portfolio";
};

const TOP_NAV: TopNavItem[] = [
  { href: ROUTES.dapp, label: "Home", kind: "home" },
  { href: ROUTES.marketsBrowse, label: "Market", kind: "markets" },
  { href: ROUTES.attention, label: "Attention", kind: "attention" },
  { href: ROUTES.portfolio, label: "Portfolio", kind: "portfolio" },
];

function navLinkClass(active: boolean, hub: boolean) {
  return cn(
    "shrink-0 text-[13px] font-medium transition",
    hub
      ? active
        ? "font-semibold text-[var(--hub-primary)]"
        : "text-[var(--hub-muted)] hover:text-[var(--hub-fg)]"
      : active
        ? "text-[#f0f6ff]"
        : "text-[#8ba3c7] hover:text-[#f0f6ff]",
  );
}

/**
 * Sticky terminal navbar — logo + primary nav, centered search, wallet.
 */
export function AppTopbar({ density = "default" }: { density?: AppTopbarDensity }) {
  useNavShortcuts();
  const hub = density === "hub";
  const showAdminNav = useShowAdminNavLink();
  const pathname = usePathname();

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
        <div className="flex min-w-0 shrink-0 items-center gap-5">
          <BrandWordmarkLink
            href={ROUTES.dapp}
            showTitle
            variant="nav"
            tone="onDark"
            priority
            className="min-w-0"
          />
          <nav className="hidden items-center gap-4 md:flex lg:gap-5">
            {TOP_NAV.map((item) => {
              let active = false;
              if (item.kind === "home") {
                active = isHubHomeActive(pathname) && !isAttentionAnchorActive(pathname);
              } else if (item.kind === "attention") {
                active = isAttentionAnchorActive(pathname);
              } else if (item.kind === "markets") {
                active =
                  pathname === "/markets" ||
                  (pathname?.startsWith("/markets/") === true &&
                    pathname !== "/markets/create" &&
                    !pathname.startsWith("/markets/breaking"));
              } else if (item.kind === "portfolio") {
                active = pathname === ROUTES.portfolio;
              }
              return (
                <PrefetchLink
                  key={item.href}
                  href={item.href}
                  className={navLinkClass(active, hub)}
                >
                  {item.label}
                </PrefetchLink>
              );
            })}
            {showAdminNav ? (
              <PrefetchLink
                href={ROUTES.adminDashboard}
                className={navLinkClass(pathname?.startsWith("/admin") ?? false, hub)}
              >
                Admin
              </PrefetchLink>
            ) : null}
          </nav>
        </div>

        {hub ? (
          <div className="flex-1" aria-hidden />
        ) : (
          <div className="min-w-0 flex-1 px-1 sm:px-2">
            <div className="mx-auto w-full min-w-0 max-w-xl lg:max-w-2xl">
              <AppSearch />
            </div>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <WalletPopover
            connectLabel={hub ? "Sign up" : "Connect Wallet"}
            variant={hub ? "hub" : "default"}
          />
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
