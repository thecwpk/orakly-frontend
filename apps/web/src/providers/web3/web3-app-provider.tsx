"use client";

/**
 * Next.js App Router Web3 stack (production-oriented):
 *
 * ```
 * WagmiProvider       — connectors, chains; reconnect gated (no silent auto-connect)
 * QueryClientProvider — shared TanStack Query cache (wagmi reconnect + app queries)
 * WalletReconnectGate — optional persisted reconnect (needs QueryClient)
 * RainbowKitProvider  — MetaMask / WalletConnect UX, network UI, modal theming
 * ```
 *
 * **Hydration:** wagmi is configured with `ssr: true` and `cookieStorage` so the
 * server-rendered tree and the first client render agree on connection metadata,
 * avoiding mismatch warnings when a wallet was previously connected.
 *
 * Mount **once** under `app/layout.tsx` (via `AppProviders`).
 */

import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "./wagmi-config";
import { WalletReconnectGate } from "./wallet-reconnect-gate";

export type Web3AppProviderProps = {
  /** Shared React Query client — create with `useState(() => createAppQueryClient())` in the parent shell. */
  queryClient: QueryClient;
  children: ReactNode;
};

export function Web3AppProvider({ queryClient, children }: Web3AppProviderProps) {
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        {/*
          Must sit inside QueryClientProvider — wagmi's useReconnect() is wired
          to TanStack Query and throws "No QueryClient set" otherwise.
        */}
        <WalletReconnectGate />
        <RainbowKitProvider
          modalSize="compact"
          theme={darkTheme({
            accentColor: "#22d3ee",
            accentColorForeground: "#050508",
            borderRadius: "large",
            fontStack: "system",
            overlayBlur: "small",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
