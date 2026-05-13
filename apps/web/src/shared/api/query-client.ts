import { QueryClient, focusManager, onlineManager } from "@tanstack/react-query";

/**
 * Global defaults tuned for long-lived cache + explicit invalidation/realtime.
 * Per-query overrides live in `cache-policy.ts`.
 */
const PROD_GC_MS = 1000 * 60 * 60 * 24 * 5;
/** Capped: 30d exceeds Node's 32-bit timer limit (~24.85d max). */
const DEV_GC_MS = Math.min(1000 * 60 * 60 * 24 * 30, 2_147_483_647);

export function createAppQueryClient(): QueryClient {
  const isProd = process.env.NODE_ENV === "production";

  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: isProd ? PROD_GC_MS : DEV_GC_MS,
        structuralSharing: true,
        retry: (failureCount, error) => {
          if (failureCount >= 3) return false;
          if (error instanceof Error && error.name === "QueryApiError") {
            const code = (error as { code?: string }).code;
            if (code === "UNAUTHORIZED" || code === "NOT_FOUND") return false;
          }
          return true;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        networkMode: "online",
      },
      mutations: {
        networkMode: "online",
        retry: 0,
      },
    },
  });
}

/** Optional: throttle noisy focus refetches across the app (debounced via query filters in hooks). */
export function subscribeAppLifecycleHints(queryClient: QueryClient) {
  const unsubFocus = focusManager.subscribe(() => {
    if (focusManager.isFocused()) {
      void queryClient.resumePausedMutations();
    }
  });

  const unsubOnline = onlineManager.subscribe(() => {
    if (onlineManager.isOnline()) {
      void queryClient.resumePausedMutations();
    }
  });

  return () => {
    unsubFocus();
    unsubOnline();
  };
}
