import type { Address } from "viem";

export type BuildAuthMessageArgs = {
  address: Address;
  chainId: number;
  nonce: string;
  host: string;
};

/**
 * SIWE-shaped plaintext for wallet authentication (readable + stable lines for nonce verification).
 */
export function buildWalletAuthMessage(args: BuildAuthMessageArgs): string {
  const { address, chainId, nonce, host } = args;
  return [
    `${host} wants you to sign in with your Ethereum account:`,
    address,
    "",
    `URI: https://${host}`,
    "Version: 1",
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${new Date().toISOString()}`,
  ].join("\n");
}

export function readNonceFromMessage(message: string): string | null {
  for (const line of message.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("Nonce:")) {
      return trimmed.slice("Nonce:".length).trim() || null;
    }
  }
  return null;
}

export function readChainIdFromMessage(message: string): number | null {
  for (const line of message.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("Chain ID:")) {
      const n = Number(trimmed.slice("Chain ID:".length).trim());
      return Number.isFinite(n) ? n : null;
    }
  }
  return null;
}
