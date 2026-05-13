import { createJSONStorage, type StateStorage } from "zustand/middleware";

/**
 * SSR-safe localStorage wrapper. Returns `null` reads on the server (so
 * `persist` produces no hydration mismatch) and accepts no-op writes.
 */
const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

/**
 * Returns a wrapped JSON storage that:
 *  - uses `localStorage` on the client,
 *  - falls back to a noop on the server,
 *  - never throws if quota is exceeded.
 */
export function createSafeJSONStorage() {
  return createJSONStorage(() => {
    if (typeof window === "undefined") return noopStorage;
    try {
      const probeKey = "__orakly_probe__";
      window.localStorage.setItem(probeKey, "1");
      window.localStorage.removeItem(probeKey);
      return window.localStorage;
    } catch {
      return noopStorage;
    }
  });
}

/** Stable `orakly:<key>` namespace prefix for persisted state. */
export function persistKey(key: string): string {
  return `orakly:${key}`;
}
