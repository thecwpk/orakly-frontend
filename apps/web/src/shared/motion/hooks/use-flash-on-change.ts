"use client";

import { useEffect, useRef, useState } from "react";

export type FlashTone = "up" | "down" | "neutral";

export type UseFlashOnChangeResult = {
  /** Tone of the most recent flash (or `null` while idle). */
  tone: FlashTone | null;
  /** Monotonic key — change detection signal for `AnimatePresence`. */
  flashKey: number;
};

export type UseFlashOnChangeOptions = {
  /** How long the flash stays active before resetting (ms). */
  durationMs?: number;
  /** Skip the very first render (avoids hydration / SSR-mismatch flashes). */
  skipFirst?: boolean;
};

/**
 * Returns a `tone` + `flashKey` whenever `value` changes. Pure logic — render
 * the actual flash UI yourself (e.g. inside `<AnimatePresence>`).
 *
 *   const { tone, flashKey } = useFlashOnChange(price);
 *   <AnimatePresence>
 *     {tone ? <motion.span key={flashKey} ... /> : null}
 *   </AnimatePresence>
 *
 * Numeric values infer direction automatically; strings always flash neutral.
 */
export function useFlashOnChange(
  value: number | string | null | undefined,
  { durationMs = 600, skipFirst = true }: UseFlashOnChangeOptions = {},
): UseFlashOnChangeResult {
  const prev = useRef<typeof value>(value);
  const isFirst = useRef<boolean>(true);
  const [state, setState] = useState<UseFlashOnChangeResult>({
    tone: null,
    flashKey: 0,
  });

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      prev.current = value;
      if (skipFirst) return;
    }
    if (prev.current === value) return;

    const a =
      typeof prev.current === "number" ? prev.current
      : typeof prev.current === "string" ? Number(prev.current)
      : Number.NaN;
    const b =
      typeof value === "number" ? value
      : typeof value === "string" ? Number(value)
      : Number.NaN;

    let nextTone: FlashTone = "neutral";
    if (Number.isFinite(a) && Number.isFinite(b)) {
      nextTone = b > a ? "up" : b < a ? "down" : "neutral";
    }

    prev.current = value;
    setState((prevState) => ({
      tone: nextTone,
      flashKey: prevState.flashKey + 1,
    }));

    const t = window.setTimeout(() => {
      setState((prevState) => ({ ...prevState, tone: null }));
    }, durationMs);

    return () => window.clearTimeout(t);
  }, [value, durationMs, skipFirst]);

  return state;
}
