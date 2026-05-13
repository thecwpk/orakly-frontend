/**
 * Enterprise-grade Zustand state architecture.
 *
 * Six canonical *domain* stores live under `./stores/*`. Each one ships with:
 *   - a typed `<Domain>State` slice and `<Domain>Actions` slice,
 *   - a fully-typed merged `<Domain>Store`,
 *   - devtools middleware (under `orakly/<domain>`),
 *   - `subscribeWithSelector` so non-React code can subscribe atomically,
 *   - optional `persist` middleware (preferences + drafts only — never auth or
 *     server data).
 *
 * Selector libraries live under `./selectors/*`. They expose:
 *   - **Primitive** selectors (`useFooBar(): boolean`) — preferred for hot
 *     paths because they trigger zero rerenders unless the primitive flips.
 *   - **Object** selectors wrapped in `useShallow` so multi-field reads still
 *     get shallow-equal change detection.
 *   - **Action** selectors that are stable refs across renders.
 *
 * Bridges (`./bridges/*`) keep external systems (wagmi, RainbowKit auth,
 * Socket.IO) in sync with the domain stores — mount once via `<StateBridges />`.
 *
 * Existing feature stores (markets-filter, watchlist, notifications,
 * trade-modal, create-market draft, etc.) are intentionally untouched. The
 * `./selectors/*.ts` modules re-export the canonical hooks so consumers can
 * import everything from `@/state` without thinking about which slice owns
 * what.
 */

/* ------------------------------------------------------------------ */
/*  Stores                                                             */
/* ------------------------------------------------------------------ */

export {
  useAuthStore,
  getAuthSnapshot,
  type AuthState,
  type AuthActions,
  type AuthStore,
  type UserRole,
} from "./stores/auth.store";

export {
  useWebsocketStore,
  getWebsocketSnapshot,
  type WebsocketState,
  type WebsocketActions,
  type WebsocketStore,
  type ConnectionStatus,
} from "./stores/websocket.store";

export {
  useUIStore,
  getUISnapshot,
  type UIState,
  type UIActions,
  type UIStore,
  type LayoutDensity,
  type ReducedMotionOverride,
} from "./stores/ui.store";

export {
  useMarketsMetaStore,
  getMarketsMetaSnapshot,
  type MarketsMetaState,
  type MarketsMetaActions,
  type MarketsMetaStore,
} from "./stores/markets.store";

export {
  usePortfolioStore,
  getPortfolioSnapshot,
  type PortfolioState,
  type PortfolioActions,
  type PortfolioStore,
  type OptimisticPositionDelta,
} from "./stores/portfolio.store";

export {
  useWalletStore,
  getWalletSnapshot,
  type WalletState,
  type WalletActions,
  type WalletStore,
  type WalletTxPhase,
  type WalletTxKind,
} from "./stores/wallet.store";

/* ------------------------------------------------------------------ */
/*  Selectors                                                          */
/* ------------------------------------------------------------------ */

export * from "./selectors/auth.selectors";
export * from "./selectors/websocket.selectors";
export * from "./selectors/ui.selectors";
export * from "./selectors/markets.selectors";
export * from "./selectors/portfolio.selectors";
export * from "./selectors/wallet.selectors";

/* ------------------------------------------------------------------ */
/*  Bridges + helpers                                                  */
/* ------------------------------------------------------------------ */

export { StateBridges } from "./bridges/state-bridges";
export { AuthBridge } from "./bridges/auth-bridge";
export { WebsocketBridge } from "./bridges/websocket-bridge";

export { useRequireRole } from "./hooks/use-require-role";

export { useShallow, shallow } from "./lib/shallow";

/* ------------------------------------------------------------------ */
/*  Backwards-compatible legacy export                                 */
/* ------------------------------------------------------------------ */

/** Canonical trading chrome store (mobile “More” sheet, wallet chrome hooks). */
export { useAppShellStore } from "@/widgets/app-shell/store/use-app-shell-store";
