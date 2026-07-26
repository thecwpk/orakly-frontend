"use client";

import { ChevronDown, Layers, Users } from "lucide-react";
import { PrefetchLink } from "@/shared/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MARKET_CATEGORIES } from "@/features/markets/lib/categories";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";

export function NavCategoriesDropdown({ className }: { className?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="Browse by category"
          className={cn(
            "inline-flex h-8 shrink-0 items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] px-2 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em] text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] hover:text-[var(--foreground)]",
            className,
          )}
        >
          <Layers className="h-3.5 w-3.5 text-[var(--foreground-muted)]" aria-hidden />
          <span className="hidden sm:inline">Categories</span>
          <ChevronDown className="h-3 w-3 text-[var(--foreground-muted)]" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="max-h-[min(72vh,420px)] w-[min(calc(100vw-1.25rem),17rem)] overflow-y-auto"
      >
        <DropdownMenuLabel className="normal-case tracking-normal text-[10px] text-chrome-muted">
          Categories
        </DropdownMenuLabel>
        {MARKET_CATEGORIES.map((cat) => (
          <DropdownMenuItem key={cat.slug} asChild>
            <PrefetchLink
              href={ROUTES.marketsBrowse}
              className="flex cursor-pointer items-start gap-2 py-1.5"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] ring-1 ring-[var(--border)]">
                <cat.icon className="h-3 w-3 text-[var(--accent)]" aria-hidden />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5 leading-tight">
                <span className="text-[11px] font-semibold text-chrome">{cat.name}</span>
                <span className="line-clamp-2 text-[9px] leading-snug text-chrome-muted">{cat.blurb}</span>
              </span>
            </PrefetchLink>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <PrefetchLink
            href={ROUTES.marketsCommunity}
            className="flex cursor-pointer items-center gap-2 py-1.5 font-mono text-[10px] uppercase tracking-wide text-chrome-muted"
          >
            <Users className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden />
            Community markets
          </PrefetchLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <PrefetchLink href={ROUTES.marketsBrowse} className="cursor-pointer font-mono text-[10px] uppercase tracking-wide text-chrome-muted">
            Full explorer
          </PrefetchLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <PrefetchLink href={ROUTES.marketsTrending} className="cursor-pointer font-mono text-[10px] uppercase tracking-wide text-chrome-muted">
            Trending tape
          </PrefetchLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
