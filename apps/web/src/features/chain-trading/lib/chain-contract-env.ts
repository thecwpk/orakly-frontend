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

export function isChainEnvConfigured(): boolean {
  return Boolean(
    getFactoryAddress() &&
      getCollateralAddress() &&
      getTreasuryAddress() &&
      getUmaOracleAddress(),
  );
}
