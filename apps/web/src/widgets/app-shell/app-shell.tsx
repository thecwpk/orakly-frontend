"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { GlobalSearch } from "@/features/search";
import { TradeModal } from "@/features/trading";
import { cn } from "@/lib/utils";
import { SocketProvider } from "@/providers";
import { ROUTES } from "@/shared/constants/routes";
import { useAuthStore } from "@/state/stores/auth.store";
import { WebsocketBridge } from "@/state";
import { appMainPageInsetStyle } from "@/shared/constants/page-layout";
import { AppTopbar } from "./components/app-topbar";
import { MobileBottomNav } from "./components/mobile-bottom-nav";
import { NavigationPendingProvider } from "./components/navigation-pending";
import "@/widgets/dapp-hub/hub-design-tokens.css";

/**
 * Trading shell — sticky top bar + dense horizontal nav (md+), mobile dock,
 * bottom “More” sheet for utilities. Full-width content column (no sidebar).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const actorId = useAuthStore((s) => s.tradingUserId ?? undefined);
  const pathname = usePathname();
  /** Hub navy canvas for all trading routes; marketing `/discover` keeps legacy canvas. */
  const hubCanvas =
    pathname !== ROUTES.discover && !pathname?.startsWith(`${ROUTES.discover}/`);

  return (
    <SocketProvider portfolioUserId={actorId ?? null}>
      <WebsocketBridge />
      <NavigationPendingProvider>
      <div
        className={cn(
          "relative min-h-screen overflow-x-hidden text-foreground",
          hubCanvas ? "hub-app-canvas" : "bg-app-canvas",
        )}
      >
        <div className="flex min-h-screen min-w-0 flex-col">
          <AppTopbar density="hub" />

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
