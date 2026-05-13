import { useShallow } from "../lib/shallow";
import {
  useWalletStore,
  type WalletStore,
  type WalletTxPhase,
} from "../stores/wallet.store";

/* Re-export the persisted movements store so callers have a single import. */
export {
  useWalletMovementsStore,
  type WalletMovement,
  type MovementKind,
} from "@/widgets/wallet/store/wallet-movements-store";

/* Primitive selectors */

export const useTxPhase = (): WalletTxPhase =>
  useWalletStore((s) => s.txPhase);

export const useTxHash = (): `0x${string}` | null =>
  useWalletStore((s) => s.txHash);

export const useTxError = (): string | null =>
  useWalletStore((s) => s.txError);

export const useTxConfirmations = (): number =>
  useWalletStore((s) => s.confirmations);

/* Derived primitives */

export const useIsTxInFlight = (): boolean =>
  useWalletStore(
    (s) =>
      s.txPhase === "preparing" ||
      s.txPhase === "pending_wallet" ||
      s.txPhase === "submitted" ||
      s.txPhase === "confirming",
  );

export const useTxIsSettled = (): boolean =>
  useWalletStore(
    (s) => s.txPhase === "success" || s.txPhase === "error",
  );

export const useTxConfirmationProgress = (): number =>
  useWalletStore((s) =>
    s.requiredConfirmations > 0
      ? Math.min(1, s.confirmations / s.requiredConfirmations)
      : 0,
  );

/* Object selector */

export const useTxState = () =>
  useWalletStore(
    useShallow((s) => ({
      phase: s.txPhase,
      kind: s.txKind,
      hash: s.txHash,
      error: s.txError,
      amountUsd: s.txAmountUsd,
      confirmations: s.confirmations,
      requiredConfirmations: s.requiredConfirmations,
      startedAt: s.startedAt,
    })),
  );

/* Action selector */

export const useWalletActions = () =>
  useWalletStore(
    useShallow((s) => ({
      beginTx: s.beginTx,
      setTxPhase: s.setTxPhase,
      setTxHash: s.setTxHash,
      setTxError: s.setTxError,
      setConfirmations: s.setConfirmations,
      finalizeTx: s.finalizeTx,
      resetTx: s.resetTx,
    })),
  );

/* External subscribe selectors */

export const selectTxPhase = (s: WalletStore) => s.txPhase;
export const selectTxHash = (s: WalletStore) => s.txHash;
