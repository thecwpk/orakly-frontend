"use client";

/**
 * Root client shell for App Router:
 * - **`Web3AppProvider`** — Wagmi + React Query + RainbowKit (test BNB, MetaMask, WalletConnect, cookie persistence).
 * - **`WalletAuthBridge`** — optional SIWE-style session layer for API routes (inside RainbowKit).
 */
import { ReactNode, useEffect, useState } from "react";
import { Toaster } from "../../../components/ui/sonner";
import { WalletTxConfirmationSync } from "@/features/wallet/components/wallet-tx-confirmation-sync";
import { WalletAuthBridge } from "@/features/wallet/providers/wallet-auth-bridge";
import { ThemeProvider, Web3AppProvider } from "@/providers";
import {
  bootstrapQueryPersistence,
  createAppQueryClient,
  subscribeAppLifecycleHints,
} from "@/shared/api";
import { AppMotionConfig } from "@/shared/motion";
import { AuthBridge } from "@/state";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createAppQueryClient());

  useEffect(() => subscribeAppLifecycleHints(queryClient), [queryClient]);

  useEffect(() => bootstrapQueryPersistence(queryClient), [queryClient]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <AppMotionConfig>
        <Web3AppProvider queryClient={queryClient}>
          <WalletAuthBridge>
            {/* Sync wagmi + SIWE session into the global auth store. Mounting
                inside Web3AppProvider so wagmi hooks resolve. */}
            <AuthBridge />
            <WalletTxConfirmationSync />
            {children}
          </WalletAuthBridge>
          <Toaster richColors position="top-center" />
        </Web3AppProvider>
      </AppMotionConfig>
    </ThemeProvider>
  );
}
