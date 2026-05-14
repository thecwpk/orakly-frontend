"use client";

import type { ReactNode } from "react";
import { TradeModal } from "@/features/trading";
import { cn } from "@/lib/utils";
import { appMainPageInsetStyle } from "@/shared/constants/page-layout";
import { SocketProvider } from "@/providers";
import { useFeedRealtimeSync } from "@/shared/api/realtime/use-feed-realtime-sync";
import { useAuthStore } from "@/state/stores/auth.store";
import { WebsocketBridge } from "@/state";
import { AppTopbar } from "@/widgets/app-shell/components/app-topbar";
import { MobileBottomNav } from "@/widgets/app-shell/components/mobile-bottom-nav";
import { MobileMoreSheet } from "@/widgets/app-shell/components/mobile-more-sheet";
import { NavigationPendingProvider } from "@/widgets/app-shell/components/navigation-pending";

/**
 * Hub chrome aligned with the trading shell — same top bar + mobile dock,
 * full-width content (no sidebar).
 */
export function MinimalMarketShell({ children }: { children: ReactNode }) {
  const actorId = useAuthStore((s) => s.tradingUserId ?? undefined);

  useFeedRealtimeSync({ debounceMs: 600 });

  return (
    <SocketProvider portfolioUserId={actorId ?? null}>
      <WebsocketBridge />
      <NavigationPendingProvider>
      <div className="hub-app-canvas relative min-h-screen overflow-x-hidden text-foreground">
        <div className="hub-shell-density flex min-h-screen min-w-0 flex-col">
          <AppTopbar density="hub" />

          <main
            id="hub-content"
            style={appMainPageInsetStyle}
            className={cn(
              "relative min-h-[calc(100dvh-var(--app-topbar-h))] min-w-0 w-full max-w-full flex-1 touch-pan-y pb-[var(--app-mobile-dock-h)] lg:pb-6",
            )}
          >
            {children}
          </main>
        </div>

        <MobileMoreSheet />
        <MobileBottomNav />

        <TradeModal />
      </div>
      </NavigationPendingProvider>
    </SocketProvider>
  );
}
