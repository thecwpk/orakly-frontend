/** User opted in to restoring the last wallet after reload (see `WalletReconnectGate`). */
export const WALLET_PERSIST_STORAGE_KEY = "orakly.wallet.persist";

export function readWalletPersistApproved(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(WALLET_PERSIST_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setWalletPersistApproved(approved: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (approved) {
      window.localStorage.setItem(WALLET_PERSIST_STORAGE_KEY, "1");
    } else {
      window.localStorage.removeItem(WALLET_PERSIST_STORAGE_KEY);
    }
  } catch {
    /* quota / private mode */
  }
}
