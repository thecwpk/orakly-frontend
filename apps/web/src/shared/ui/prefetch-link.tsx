"use client";

import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";

/** Hover/focus/touch prefetch delay — avoids work during accidental passes */
const PREFETCH_DEBOUNCE_MS = 56;

/**
 * Premium navigation link with both **route prefetch** (Next.js) and
 * optional **data prefetch** (React Query) wired to hover/focus —
 * the same trick Linear/Stripe use to make navigation feel instant.
 *
 *   <PrefetchLink
 *     href={`/markets/${slug}`}
 *     onPrefetch={() => prefetchMarketOdds(id)}
 *   />
 *
 * Behavior:
 *   - First hover/focus warms route + data caches (debounced to 50ms).
 *   - Touchstart prewarms on mobile (since hover doesn't fire there).
 *   - All effects are idempotent — re-hovering is cheap.
 */

type PrefetchLinkProps = Omit<LinkProps, "prefetch"> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "ref"> & {
    children?: ReactNode;
    /** Optional data prefetch callback (e.g. React Query warmer). */
    onPrefetch?: () => void;
    /** Disable Next.js route prefetch (defaults to enabled on hover). */
    disablePrefetch?: boolean;
  };

export const PrefetchLink = forwardRef<HTMLAnchorElement, PrefetchLinkProps>(
  function PrefetchLink(
    { onPrefetch, disablePrefetch, onMouseEnter, onFocus, onTouchStart, ...rest },
    ref,
  ) {
    const router = useRouter();
    const warmed = useRef(false);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const warm = useCallback(() => {
      if (warmed.current) return;
      warmed.current = true;
      try {
        if (!disablePrefetch && typeof rest.href === "string") {
          router.prefetch(rest.href);
        }
        onPrefetch?.();
      } catch {
        warmed.current = false;
      }
    }, [disablePrefetch, onPrefetch, rest.href, router]);

    const scheduleWarm = useCallback(() => {
      if (debounceTimerRef.current) return;
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        warm();
      }, PREFETCH_DEBOUNCE_MS);
    }, [warm]);

    useEffect(
      () => () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      },
      [],
    );

    return (
      <Link
        ref={ref}
        prefetch={false}
        {...rest}
        onMouseEnter={(e) => {
          scheduleWarm();
          onMouseEnter?.(e);
        }}
        onFocus={(e) => {
          scheduleWarm();
          onFocus?.(e);
        }}
        onTouchStart={(e) => {
          scheduleWarm();
          onTouchStart?.(e);
        }}
      />
    );
  },
);
