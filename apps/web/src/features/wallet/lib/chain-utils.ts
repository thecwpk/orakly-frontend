import type { Chain } from "wagmi/chains";
import { tbnbChain } from "../config/chains";

export const REQUIRED_CHAIN = tbnbChain;

export function isCorrectChain(chainId: number | undefined): boolean {
  return chainId === REQUIRED_CHAIN.id;
}

export function chainLabel(chain: Chain | undefined): string {
  return chain?.name ?? "Unknown network";
}
