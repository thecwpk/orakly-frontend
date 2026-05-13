"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { NAV_GROUPS } from "./nav-config";

/** Polymarket-style `g` chord shortcuts (`g m` markets, `g p` portfolio, …). Skips when typing in inputs. */
export function useNavShortcuts(): void {
  const router = useRouter();

  const map = useMemo(() => {
    const m = new Map<string, string>();
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        if (!item.shortcut) continue;
        const parts = item.shortcut.split(/\s+/);
        if (parts.length === 2 && parts[0] === "g" && parts[1]) {
          m.set(parts[1].toLowerCase(), item.href);
        }
      }
    }
    return m;
  }, []);

  const lastG = useRef<number>(0);

  useEffect(() => {
    function isTyping(): boolean {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return false;
      if (el.isContentEditable) return true;
      const tag = el.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || tag === "select";
    }

    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping()) return;
      const k = e.key.toLowerCase();
      const now = performance.now();
      if (k === "g") {
        lastG.current = now;
        return;
      }
      const recentlyG = now - lastG.current < 1000;
      if (recentlyG && map.has(k)) {
        e.preventDefault();
        const href = map.get(k)!;
        lastG.current = 0;
        router.push(href);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [map, router]);
}
