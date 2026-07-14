import type { Address } from "viem";
import { chainPublicEnv } from "@/lib/chain-public-env";

export function getFactoryAddress(): Address | null {
  const raw = chainPublicEnv.factoryAddress;
  if (!raw || raw === "0x" || raw === "0x0") return null;
  return raw as Address;
}

export function bscTestnetTxUrl(txHash: string): string {
  return `https://testnet.bscscan.com/tx/${txHash}`;
}

export function bscTestnetAddressUrl(address: string): string {
  return `https://testnet.bscscan.com/address/${address}`;
}

export function getCollateralAddress(): Address | null {
  const raw = chainPublicEnv.collateralAddress;
  if (!raw) return null;
  return raw as Address;
}

export function getTreasuryAddress(): Address | null {
  const raw = chainPublicEnv.treasuryAddress;
  if (!raw) return null;
  return raw as Address;
}

export function getUmaOracleAddress(): Address | null {
  const raw = chainPublicEnv.umaOptimisticOracleV3;
  if (!raw) return null;
  return raw as Address;
}

export function collateralDecimals(): number {
  const n = Number(chainPublicEnv.collateralDecimals);
  return Number.isFinite(n) && n > 0 ? n : 6;
}

/** Raw outcome share amounts use the same scale as collateral (see Market.sol). */
export function outcomeShareDecimals(): number {
  return collateralDecimals();
}

export function isChainEnvConfigured(): boolean {
  return getMissingChainEnvKeys().length === 0;
}

/** Which required contract env keys are still empty after testnet fallbacks. */
export function getMissingChainEnvKeys(): string[] {
  const missing: string[] = [];
  if (!getFactoryAddress()) missing.push("factory (NEXT_PUBLIC_FACTORY_ADDRESS)");
  if (!getCollateralAddress()) missing.push("collateral (NEXT_PUBLIC_COLLATERAL_ADDRESS)");
  if (!getTreasuryAddress()) missing.push("treasury (NEXT_PUBLIC_TREASURY_ADDRESS)");
  if (!getUmaOracleAddress()) missing.push("UMA oracle (NEXT_PUBLIC_UMA_OPTIMISTIC_ORACLE_V3)");
  return missing;
}

export function chainEnvConfigErrorMessage(): string {
  const missing = getMissingChainEnvKeys();
  if (missing.length === 0) return "";
  return `On-chain env missing — set ${missing.join(", ")}.`;
}
