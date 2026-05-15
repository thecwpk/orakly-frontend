"use client";

import { Suspense, type ReactNode } from "react";
import { TradeModal } from "@/features/trading";
import { cn } from "@/lib/utils";
import { SocketProvider } from "@/providers";
import { useAuthStore } from "@/state/stores/auth.store";
import { WebsocketBridge } from "@/state";
import { appMainPageInsetStyle } from "@/shared/constants/page-layout";
import { AppTopbar } from "./components/app-topbar";
import { MobileBottomNav } from "./components/mobile-bottom-nav";
import { MobileMoreSheet } from "./components/mobile-more-sheet";
import { NavigationPendingProvider } from "./components/navigation-pending";

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
      <div className="relative min-h-screen overflow-x-hidden bg-app-canvas text-foreground">
        <div className="flex min-h-screen min-w-0 flex-col">
          <AppTopbar />

          <main
            id="app-content"
            style={appMainPageInsetStyle}
            className={cn(
              "relative min-w-0 w-full max-w-full flex-1 touch-pan-y pb-[var(--app-mobile-dock-h)] lg:pb-0",
            )}
          >
            {children}
          </main>
        </div>

        <MobileMoreSheet />
        <Suspense fallback={null}>
          <MobileBottomNav />
        </Suspense>

        <TradeModal />
      </div>
      </NavigationPendingProvider>
    </SocketProvider>
  );
}
