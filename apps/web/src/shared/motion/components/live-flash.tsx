"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  memo,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { DURATION, EASE_OUT } from "../tokens";
import { cn } from "@/lib/utils";

export type FlashTone = "up" | "down" | "neutral" | "auto";

const TONE: Record<Exclude<FlashTone, "auto">, string> = {
  up: "bg-emerald-400/22 ring-emerald-400/45",
  down: "bg-rose-400/22 ring-rose-400/45",
  neutral: "bg-cyan-400/18 ring-cyan-400/35",
};

export type LiveFlashProps = HTMLAttributes<HTMLDivElement> & {
  /** The value driving the flash — when it changes, the overlay flashes. */
  value: number | string | null | undefined;
  children: ReactNode;
  /**
   * `"auto"` (default) compares numeric values and picks `up`/`down`; falls
   * back to `neutral` for non-numeric or first render.
   */
  tone?: FlashTone;
  /** Total flash duration (ms). */
  durationMs?: number;
  /** Skip the very first render so first paint doesn't flash. */
  skipFirst?: boolean;
};

function toNumber(v: LiveFlashProps["value"]): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Briefly flashes a tinted overlay over its children when `value` changes —
 * the canonical realtime "this row just updated" cue used in trading desks.
 *
 *   <LiveFlash value={odds.yesPrice}>
 *     <span className="font-mono">{cents(odds.yesPrice)}</span>
 *   </LiveFlash>
 *
 * Implementation notes:
 *   - The overlay only animates `opacity` (compositor only).
 *   - `auto` tone derives `up`/`down` from numeric value direction.
 *   - The first paint never flashes (avoids noise on hydration / SSR diff).
 */
function LiveFlashImpl({
  value,
  children,
  tone = "auto",
  durationMs = 600,
  skipFirst = true,
  className,
  style,
  ...rest
}: LiveFlashProps) {
  const prev = useRef<typeof value>(value);
  const isFirst = useRef<boolean>(true);
  const [flash, setFlash] = useState<{
    key: number;
    tone: Exclude<FlashTone, "auto">;
  } | null>(null);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      prev.current = value;
      if (skipFirst) return;
    }
    if (prev.current === value) return;

    let resolvedTone: Exclude<FlashTone, "auto">;
    if (tone === "auto") {
      const a = toNumber(prev.current);
      const b = toNumber(value);
      if (a != null && b != null) {
        resolvedTone = b > a ? "up" : b < a ? "down" : "neutral";
      } else {
        resolvedTone = "neutral";
      }
    } else {
      resolvedTone = tone;
    }

    prev.current = value;
    setFlash({ key: Date.now(), tone: resolvedTone });
  }, [value, tone, skipFirst]);

  return (
    <span
      className={cn("relative isolate inline-block", className)}
      style={style}
      {...rest}
    >
      <span className="relative z-10">{children}</span>
      <AnimatePresence>
        {flash ? (
          <motion.span
            key={flash.key}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{
              duration: durationMs / 1000,
              ease: EASE_OUT,
              times: [0, 0.18, 1],
            }}
            onAnimationComplete={() => setFlash(null)}
            className={cn(
              "pointer-events-none absolute -inset-x-0.5 -inset-y-0.5 -z-0 rounded-[6px] ring-1",
              TONE[flash.tone],
            )}
            style={
              {
                ["--flash-duration" as string]: `${durationMs}ms`,
              } as CSSProperties
            }
          />
        ) : null}
      </AnimatePresence>
    </span>
  );
}

export const LiveFlash = memo(LiveFlashImpl);

/* Re-export shared duration for callers that want to gate dependent UI. */
export { DURATION as MOTION_DURATION };
