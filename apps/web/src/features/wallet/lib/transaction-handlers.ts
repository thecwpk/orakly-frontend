import type { TransactionReceipt } from "viem";

export function receiptSucceeded(receipt: TransactionReceipt): boolean {
  return receipt.status === "success";
}

export function shortTxHash(hash: `0x${string}`): string {
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}
