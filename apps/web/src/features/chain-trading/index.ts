/**
 * On-chain trade execution facade — wagmi writes + viem receipts + optimistic React Query + WS coalesce hooks.
 *
 * 1. Configure `NEXT_PUBLIC_CHAIN_MARKET_TRADE_ADDRESS`
 * 2. Align `abis/market-trade.ts` + `lib/outcome.ts` with your contract
 * 3. Map Prisma `market.id` → `onChainMarketId` via metadata/API
 */

export {
  getChainMarketTradeAddress,
  isChainTradingConfigured,
} from "./config/contracts";
export { chainMarketTradeAbi } from "./abis/market-trade";
export { outcomeToChainUint8, type TradeOutcomeSide } from "./lib/outcome";
export { formatChainTradeError } from "./lib/format-trade-error";
export { createChainTradingPublicClient } from "./lib/viem-read-client";
export {
  useChainTradeBuy,
  useOptimisticChainTradeMutation,
  useMirrorWalletTxToasts,
  useDeployOnChainMarket,
  useChainMarketExecution,
  useOnChainTradePreview,
  useLinkMarketOnChain,
  type ChainTradeBuyArgs,
  type OptimisticChainTradeBody,
} from "./hooks";
export {
  getFactoryAddress,
  getCollateralAddress,
  getTreasuryAddress,
  isChainEnvConfigured,
  bscTestnetTxUrl,
  collateralDecimals,
  chainEnvConfigErrorMessage,
  getMissingChainEnvKeys,
} from "./lib/chain-contract-env";
export { narrativeToChainCategory } from "./lib/narrative-to-chain-category";
export { ChainTradeOutcomeButtons } from "./components/chain-trade-outcome-buttons";
