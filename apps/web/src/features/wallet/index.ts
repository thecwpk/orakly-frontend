/** Web3 surface area for Orakly — RainbowKit + wagmi + viem on test BNB (BSC testnet). */

export { testBnbChain, tbnbChain } from "./config/chains";
export { wagmiConfig } from "./config/wagmi-config";
export { Web3AppProvider } from "@/providers/web3";
export {
  PremiumPolymarketConnect,
  type PremiumPolymarketConnectProps,
} from "./components/premium-polymarket-connect";
export { PremiumWalletTrigger } from "./components/premium-wallet-trigger";
export { BlockchainGate } from "./components/blockchain-gate";
export { WalletTxConfirmationSync } from "./components/wallet-tx-confirmation-sync";

export {
  WALLET_SESSION_COOKIE,
  signWalletSessionToken,
  verifyWalletSessionToken,
  tryVerifyWalletSessionToken,
  type WalletSessionClaims,
} from "./server/wallet-session";

export {
  buildWalletAuthMessage,
  readNonceFromMessage,
  readChainIdFromMessage,
} from "./lib/auth-message";

export {
  REQUIRED_CHAIN,
  isCorrectChain,
  chainLabel,
} from "./lib/chain-utils";

export { receiptSucceeded, shortTxHash } from "./lib/transaction-handlers";

export { useWalletUiStore, type WalletTxPhase } from "./store/wallet-ui.store";

export {
  useRequireTbnb,
  useTrackedSendTransaction,
  useTrackedWriteContract,
  useWalletSessionQuery,
  walletSessionQueryKey,
  useWalletAuthNonceMutation,
  useWalletAuthVerifyMutation,
  useWalletAuthSignOutMutation,
  type WalletSessionPayload,
} from "./hooks";
