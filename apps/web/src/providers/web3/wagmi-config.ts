import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  metaMaskWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import type { Config } from "wagmi";
import { cookieStorage, createStorage } from "wagmi";
import { testBnbChain } from "./chains";

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() ?? "";

/**
 * Wagmi config for Next.js App Router:
 * - **`ssr: true`** — safe SSR + aligned client hydration.
 * - **`cookieStorage`** — wagmi state persistence; reconnect runs only after explicit user opt-in
 *   (see `WalletReconnectGate` + `reconnectOnMount={false}` on `WagmiProvider`).
 * - Single chain: **test BNB** testnet (97).
 *
 * WalletConnect / Reown **`projectId`** — create at https://cloud.reown.com (formerly cloud.walletconnect.com).
 * Add each dev origin (e.g. `http://localhost:3000`) to the project **Allowlist** or the console shows “Origin … not found on Allowlist”.
 */
export const wagmiConfig: Config = getDefaultConfig({
  appName: "Orakly Market",
  projectId: walletConnectProjectId || "00000000000000000000000000000000",
  chains: [testBnbChain],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  wallets: [
    {
      groupName: "Recommended",
      wallets: [metaMaskWallet, walletConnectWallet, injectedWallet],
    },
  ],
});
