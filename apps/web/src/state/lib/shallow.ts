/**
 * Re-export of Zustand's shallow comparator + ergonomic factory so call-sites
 * can `import { useShallow } from "@/state/lib/shallow"` without reaching into
 * Zustand internals. Pairs well with object-returning selectors:
 *
 * ```ts
 * const { txPhase, txError } = useWalletStore(
 *   useShallow((s) => ({ txPhase: s.txPhase, txError: s.txError })),
 * );
 * ```
 */
export { useShallow } from "zustand/react/shallow";
export { shallow } from "zustand/shallow";
