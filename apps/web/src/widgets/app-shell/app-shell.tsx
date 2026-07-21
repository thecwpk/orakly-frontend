"use client";

import { Suspense, type ReactNode } from "react";
import { GlobalSearch } from "@/features/search";
import { TradeModal } from "@/features/trading";
import { SocketProvider } from "@/providers";
import { useAuthStore } from "@/state/stores/auth.store";
import { WebsocketBridge } from "@/state";
import { appMainPageInsetStyle } from "@/shared/constants/page-layout";
import { AppTopbar } from "./components/app-topbar";
import { AppFooter } from "./components/app-footer";
import { MobileBottomNav } from "./components/mobile-bottom-nav";
import { NavigationPendingProvider } from "./components/navigation-pending";
import "@/widgets/dapp-hub/hub-design-tokens.css";

/**
 * Trading shell — sticky top bar + dense horizontal nav (md+), mobile dock,
 * bottom “More” sheet for utilities. Full-width content column (no sidebar).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const actorId = useAuthStore((s) => s.tradingUserId ?? undefined);

  return (
    <SocketProvider portfolioUserId={actorId ?? null}>
      <WebsocketBridge />
      <NavigationPendingProvider>
      <div className="hub-app-canvas relative min-h-screen overflow-x-hidden text-foreground">
        <div className="flex min-h-screen min-w-0 flex-col">
          <AppTopbar density="hub" />

          <main
            id="app-content"
            style={appMainPageInsetStyle}
            className="relative min-w-0 w-full max-w-full flex-1 touch-pan-y pt-14 pb-[var(--app-mobile-dock-h)] lg:pb-0"
          >
            {children}
            <AppFooter />
          </main>
        </div>

        <Suspense fallback={null}>
          <MobileBottomNav />
        </Suspense>

        <TradeModal />
        <GlobalSearch />
      </div>
      </NavigationPendingProvider>
    </SocketProvider>
  );
}
