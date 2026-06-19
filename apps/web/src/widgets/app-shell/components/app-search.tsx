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
  variant?: "default" | "hub-light";
};

/**
 * Lightweight global search — ⌘K focus. Submits into the markets directory by default.
 */
export function AppSearch({
  className,
  submitTarget = "markets",
  variant = "default",
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

  const hubLight = variant === "hub-light";

  return (
    <form
      role="search"
      aria-label="Global search"
      onSubmit={onSubmit}
      className={cn(
        "group relative flex h-10 w-full max-w-none items-center rounded-lg border transition",
        hubLight
          ? "border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] hover:border-gray-300"
          : "h-9 rounded-[10px] border-white/[0.07] bg-white/[0.03] shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] hover:border-white/[0.1] hover:bg-white/[0.045]",
        !hubLight &&
          (focused
            ? "border-cyan-500/35 bg-white/[0.06] shadow-[0_0_20px_-10px_rgba(34,211,238,0.35)]"
            : ""),
        hubLight && focused && "border-[var(--hub-primary)] ring-2 ring-[var(--hub-primary)]/15",
        className,
      )}
    >
      <Search
        className={cn(
          "ml-3 h-4 w-4 transition",
          hubLight
            ? focused
              ? "text-[var(--hub-primary)]"
              : "text-[var(--hub-muted)]"
            : focused
              ? "text-cyan-300"
              : "text-zinc-500",
        )}
      />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={hubLight ? "Search" : "Search markets by topic or keyword."}
        className={cn(
          "h-full min-w-0 flex-1 bg-transparent px-2 text-sm focus:outline-none",
          hubLight
            ? "font-normal text-[var(--hub-fg)] placeholder:text-[var(--hub-muted)]"
            : "text-[12px] font-medium text-zinc-100 placeholder:text-zinc-600",
        )}
        autoComplete="off"
        spellCheck={false}
      />
      {!hubLight ? (
        <kbd className="mr-1.5 hidden h-[18px] select-none items-center gap-0.5 rounded border border-white/10 bg-black/30 px-1 font-mono text-[9px] font-medium text-zinc-500 sm:inline-flex">
          ⌘K
        </kbd>
      ) : null}
    </form>
  );
}
