/**
 * BNB Smart Chain testnet (Chapel, chain id 97) — public env only.
 * Accepts legacy names (NEXT_PUBLIC_RPC_URL, NEXT_PUBLIC_FACTORY_ADDRESS, …)
 * and repo-native aliases (NEXT_PUBLIC_TBNB_RPC_URL, NEXT_PUBLIC_CHAIN_MARKET_TRADE_ADDRESS).
 */

function trimEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function firstNonEmpty(...values: string[]): string {
  for (const v of values) {
    if (v) return v;
  }
  return "";
}

function parseAddressList(raw: string): `0x${string}`[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean)
    .map((a) => (a.startsWith("0x") ? a : `0x${a}`) as `0x${string}`);
}

/** Orakly BSC testnet (97) deployment — used when env vars are unset (e.g. Vercel pre-config). */
const BSC_TESTNET_CONTRACT_DEFAULTS = {
  factoryAddress: "0x180532197f84701e5e183ccbd2f66ea52982dbb2",
  collateralAddress: "0xf327c48b8acf444311938bf380a26fddb48bb67d",
  treasuryAddress: "0xA5c5814BA8F5a3926513fD78DDb0968711Ebe8D4",
  umaOptimisticOracleV3: "0x911a78b32c66261bff31b01a122b4f1e2df8da51",
} as const;

/** HTTP RPC for BSC testnet — client + server fallbacks. */
export function getBscTestnetRpcUrl(): string {
  return firstNonEmpty(
    trimEnv("NEXT_PUBLIC_TBNB_RPC_URL"),
    trimEnv("NEXT_PUBLIC_RPC_URL"),
    trimEnv("BSC_TESTNET_RPC_URL"),
    "https://data-seed-prebsc-1-s1.binance.org:8545",
  );
}

/** On-chain trade / factory contract (buyOutcomeShares-compatible deployment). */
export function getChainMarketTradeAddressRaw(): string {
  return firstNonEmpty(
    trimEnv("NEXT_PUBLIC_CHAIN_MARKET_TRADE_ADDRESS"),
    trimEnv("NEXT_PUBLIC_FACTORY_ADDRESS"),
  );
}

export function getFactoryAddressRaw(): string {
  return firstNonEmpty(
    trimEnv("NEXT_PUBLIC_FACTORY_ADDRESS"),
    getChainMarketTradeAddressRaw(),
    BSC_TESTNET_CONTRACT_DEFAULTS.factoryAddress,
  );
}

export const chainPublicEnv = {
  walletConnectProjectId: trimEnv("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID"),
  supportedChainIds: trimEnv("NEXT_PUBLIC_SUPPORTED_CHAIN_IDS") || "97",
  rpcUrl: getBscTestnetRpcUrl(),
  factoryAddress: getFactoryAddressRaw(),
  factoryDeployBlock: trimEnv("NEXT_PUBLIC_FACTORY_DEPLOY_BLOCK"),
  collateralAddress: firstNonEmpty(
    trimEnv("NEXT_PUBLIC_COLLATERAL_ADDRESS"),
    BSC_TESTNET_CONTRACT_DEFAULTS.collateralAddress,
  ),
  collateralDecimals: trimEnv("NEXT_PUBLIC_COLLATERAL_DECIMALS") || "6",
  treasuryAddress: firstNonEmpty(
    trimEnv("NEXT_PUBLIC_TREASURY_ADDRESS"),
    BSC_TESTNET_CONTRACT_DEFAULTS.treasuryAddress,
  ),
  umaOptimisticOracleV3: firstNonEmpty(
    trimEnv("NEXT_PUBLIC_UMA_OPTIMISTIC_ORACLE_V3"),
    BSC_TESTNET_CONTRACT_DEFAULTS.umaOptimisticOracleV3,
  ),
  adminAddresses: parseAddressList(trimEnv("NEXT_PUBLIC_ADMIN_ADDRESSES")),
  bscTestnetUsdcFaucetUrl: trimEnv("NEXT_PUBLIC_BSC_TESTNET_USDC_FAUCET_URL"),
} as const;
