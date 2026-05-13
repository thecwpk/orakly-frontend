"use client";

import { useCallback, useRef, type PointerEvent, type RefObject } from "react";

export type UseMouseGlowOptions = {
  /** Disable updates — clears the glow when toggled on. */
  disabled?: boolean;
};

export type UseMouseGlowResult = {
  /** Attach to the wrapper that should host the glow. */
  ref: RefObject<HTMLDivElement | null>;
  onPointerMove: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerLeave: () => void;
};

/**
 * Pointer-tracked CSS variable updater for compositor-only hover glows.
 *
 * Use when you can't (or don't want to) wrap children in `<HoverGlow>` —
 * e.g. when the surface is already a Framer `motion.*` element with its own
 * layout/transform context. Writes `--mx`, `--my`, `--glow-opacity` directly
 * on the ref node so React never re-renders during pointer movement.
 *
 *   const glow = useMouseGlow();
 *   <motion.button ref={glow.ref} {...glow}>
 */
export function useMouseGlow({
  disabled = false,
}: UseMouseGlowOptions = {}): UseMouseGlowResult {
  const ref = useRef<HTMLDivElement | null>(null);

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      node.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      node.style.setProperty("--my", `${e.clientY - rect.top}px`);
      node.style.setProperty("--glow-opacity", "1");
    },
    [disabled],
  );

  const onPointerLeave = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    node.style.setProperty("--glow-opacity", "0");
  }, []);

  return { ref, onPointerMove, onPointerLeave };
}
