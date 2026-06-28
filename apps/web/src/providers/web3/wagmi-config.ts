import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  rabbyWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import type { Config } from "wagmi";
import { cookieStorage, createStorage } from "wagmi";
import { chainPublicEnv } from "@/lib/chain-public-env";
import { testBnbChain } from "./chains";

const walletConnectProjectId =
  chainPublicEnv.walletConnectProjectId ||
  "5e858fceaadb5773ae641adf69411b00";

/**
 * Wagmi + RainbowKit for Next.js App Router (BSC testnet / chain 97).
 *
 * Use **injectedWallet** for MetaMask — not `metaMaskWallet` alongside it.
 * Both hook `window.ethereum` and together they can throw a client-side crash
 * when the user picks MetaMask in the connect modal.
 */
export const wagmiConfig: Config = getDefaultConfig({
  appName: "Orakly Market",
  projectId: walletConnectProjectId,
  chains: [testBnbChain],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  wallets: [
    {
      groupName: "Recommended",
      wallets: [injectedWallet, rabbyWallet, walletConnectWallet],
    },
  ],
});
