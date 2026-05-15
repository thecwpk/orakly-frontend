"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { useSignalNavigationStart } from "./navigation-pending";

type AppSearchProps = {
  className?: string;
  /**
   * Where Enter navigates. `markets` opens the directory with `?q=` (URL-synced filters).
   * `home` is legacy naming — resolves to the markets directory now that `/` is marketing.
   */
  submitTarget?: "markets" | "home";
};

/**
 * Lightweight global search — ⌘K focus. Submits into the markets directory by default.
 */
export function AppSearch({
  className,
  submitTarget = "markets",
}: AppSearchProps) {
  const router = useRouter();
  const signalNavigationStart = useSignalNavigationStart();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = value.trim();
    if (submitTarget === "home") {
      if (!q) {
        signalNavigationStart();
        router.push(ROUTES.discover);
        return;
      }
      signalNavigationStart();
      router.push(`${ROUTES.markets}?q=${encodeURIComponent(q)}`);
      return;
    }
    if (!q) {
      signalNavigationStart();
      router.push(ROUTES.discover);
      return;
    }
    signalNavigationStart();
    router.push(`${ROUTES.markets}?q=${encodeURIComponent(q)}`);
  }

  return (
    <form
      role="search"
      aria-label="Global search"
      onSubmit={onSubmit}
      className={cn(
        "group relative flex h-9 w-full max-w-none items-center rounded-[10px] border border-white/[0.07] bg-white/[0.03] shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] transition",
        focused
          ? "border-cyan-500/35 bg-white/[0.06] shadow-[0_0_20px_-10px_rgba(34,211,238,0.35)]"
          : "hover:border-white/[0.1] hover:bg-white/[0.045]",
        className,
      )}
    >
      <Search
        className={cn(
          "ml-2.5 h-3.5 w-3.5 transition",
          focused ? "text-cyan-300" : "text-zinc-500",
        )}
      />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search markets by topic or keyword."
        className="h-full min-w-0 flex-1 bg-transparent px-2 text-[12px] font-medium text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
        autoComplete="off"
        spellCheck={false}
      />
      <kbd className="mr-1.5 hidden h-[18px] select-none items-center gap-0.5 rounded border border-white/10 bg-black/30 px-1 font-mono text-[9px] font-medium text-zinc-500 sm:inline-flex">
        ⌘K
      </kbd>
    </form>
  );
}
