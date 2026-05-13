"use client";

import { GlobalMarketingNavbar } from "./global-marketing-navbar";
import { NavTrendingTicker } from "./nav-trending-ticker";
import { NotificationBell } from "./notification-popover";
import { UserMenu } from "./user-menu";
import { WalletPopover } from "./wallet-popover";
import { useNavShortcuts } from "../lib/use-nav-shortcuts";

/**
 * Unified marketing-style primary chrome + optional ticker (hub vs activity tape).
 * Used across `(app)` and `(hub)` layouts.
 */
export function AppMarketingChromeHeader({ hub }: { hub: boolean }) {
  useNavShortcuts();

  return (
    <header role="banner" data-marketing-chrome={hub ? "hub" : "app"} className="sticky top-0 z-40">
      <GlobalMarketingNavbar
        variant="app"
        appendActions={
          <>
            <WalletPopover />
            <NotificationBell />
            <UserMenu />
          </>
        }
      />
      <div className="chrome-edge-subtle hidden border-t border-app-subtle bg-app-chrome/97 backdrop-blur-sm supports-[backdrop-filter]:backdrop-blur-md md:block">
        <NavTrendingTicker compact={hub} mode={hub ? "markets" : "activity"} />
      </div>
    </header>
  );
}
