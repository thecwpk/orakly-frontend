"use client";

import { useIsFetching } from "@tanstack/react-query";
import { usePathname, useSearchParams } from "next/navigation";
import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type NavigationPendingValue = {
  pending: boolean;
  signalNavigationStart: () => void;
};

const NavigationPendingContext = createContext<NavigationPendingValue | null>(
  null,
);

const MAX_PENDING_MS = 18_000;

function shouldSignalInternalNavigation(href: string): boolean {
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    const next = `${url.pathname}${url.search}`;
    const cur = `${window.location.pathname}${window.location.search}`;
    return next !== cur;
  } catch {
    return false;
  }
}

function trySignalNavFromAnchor(
  el: Element | null,
  signalNavigationStart: () => void,
): void {
  const a = el?.closest?.("a[href]");
  if (!a || !(a instanceof HTMLAnchorElement)) return;
  const href = a.getAttribute("href");
  if (!href || href.startsWith("#")) return;
  if (!shouldSignalInternalNavigation(href)) return;
  signalNavigationStart();
}

/**
 * Clears pending when only `search` changes (same pathname).
 * Must render under Suspense — `useSearchParams` may suspend.
 *
 * Skips the first run so we do not clear a bar that was just shown by a link
 * click on the initial mount / strict-mode replay.
 */
function ClearPendingOnSearchChange({
  onClear,
}: {
  onClear: () => void;
}) {
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const didMountRef = useRef(false);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    onClear();
  }, [qs, onClear]);

  return null;
}

export function NavigationPendingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const clearPending = useCallback(() => {
    clearTimers();
    setPending(false);
  }, [clearTimers]);

  const signalNavigationStart = useCallback(() => {
    clearTimers();
    setPending(true);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      setPending(false);
    }, MAX_PENDING_MS);
  }, [clearTimers]);

  useEffect(() => {
    clearPending();
  }, [pathname, clearPending]);

  useEffect(() => {
    function onPointerDownCapture(e: PointerEvent) {
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      trySignalNavFromAnchor(e.target as Element | null, signalNavigationStart);
    }

    function onClickCapture(e: MouseEvent) {
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      trySignalNavFromAnchor(e.target as Element | null, signalNavigationStart);
    }

    document.addEventListener("pointerdown", onPointerDownCapture, true);
    document.addEventListener("click", onClickCapture, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDownCapture, true);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, [signalNavigationStart]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const value = useMemo<NavigationPendingValue>(
    () => ({ pending, signalNavigationStart }),
    [pending, signalNavigationStart],
  );

  return (
    <NavigationPendingContext.Provider value={value}>
      <Suspense fallback={null}>
        <ClearPendingOnSearchChange onClear={clearPending} />
      </Suspense>
      <RouteTransitionIndicator />
      {children}
    </NavigationPendingContext.Provider>
  );
}

export function useNavigationPending(): NavigationPendingValue {
  const ctx = useContext(NavigationPendingContext);
  if (!ctx) {
    throw new Error(
      "useNavigationPending must be used within NavigationPendingProvider",
    );
  }
  return ctx;
}

/** Safe for optional shells — returns noop until provider mounts. */
export function useSignalNavigationStart(): () => void {
  const ctx = useContext(NavigationPendingContext);
  return ctx?.signalNavigationStart ?? (() => {});
}

/**
 * Polymarket-style top loading strip: fixed to the viewport, cyan indeterminate
 * sweep while navigating or while first-load queries are in flight.
 */
export function RouteTransitionIndicator() {
  const ctx = useContext(NavigationPendingContext);
  const navPending = ctx?.pending ?? false;

  const pendingInitialFetches = useIsFetching({
    predicate: (q) =>
      q.state.fetchStatus === "fetching" && q.state.status === "pending",
  });

  const visible = navPending || pendingInitialFetches > 0;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[9998] h-[3px] overflow-hidden bg-[color-mix(in_srgb,var(--foreground)_12%,transparent)] transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0",
      )}
      aria-hidden={!visible}
    >
      <div
        className={cn(
          "app-nav-progress-fill absolute left-0 top-0 h-full w-[38%] max-w-[min(520px,72vw)] rounded-none",
          "bg-gradient-to-r from-[var(--accent)] via-[var(--info)] to-[color-mix(in_srgb,var(--accent)_55%,white)]",
          "shadow-[0_0_20px_rgba(56,189,248,0.55)]",
          visible ? "app-nav-progress-animate" : "",
        )}
      />
    </div>
  );
}
