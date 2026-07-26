"use client";

import { Suspense, type ReactNode } from "react";
import { appMainPageInsetStyle } from "@/shared/constants/page-layout";
import { AppTopbar } from "@/widgets/app-shell/components/app-topbar";
import { MobileBottomNav } from "@/widgets/app-shell/components/mobile-bottom-nav";
import { NavigationPendingProvider } from "@/widgets/app-shell/components/navigation-pending";
import "@/widgets/dapp-hub/hub-design-tokens.css";
import "@/widgets/admin-dashboard/admin-hub-scope.css";

/** Operator routes use the same hub chrome as the trading app. */
export function AdminAppShell({ children }: { children: ReactNode }) {
  return (
    <NavigationPendingProvider>
      <div className="relative min-h-screen overflow-x-hidden hub-app-canvas hub-admin-canvas text-[var(--hub-fg)]">
        <div className="flex min-h-screen min-w-0 flex-col">
          <AppTopbar density="hub" />
          <main
            id="app-content"
            style={appMainPageInsetStyle}
            className="relative min-w-0 w-full max-w-full flex-1 touch-pan-y pb-[var(--app-mobile-dock-h)] lg:pb-0"
          >
            {children}
          </main>
        </div>
        <Suspense fallback={null}>
          <MobileBottomNav />
        </Suspense>
      </div>
    </NavigationPendingProvider>
  );
}
