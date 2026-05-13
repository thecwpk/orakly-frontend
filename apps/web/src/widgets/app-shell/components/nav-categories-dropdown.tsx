"use client";

import { ChevronDown, Layers } from "lucide-react";
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
            "inline-flex h-8 shrink-0 items-center gap-1 rounded-[3px] border border-white/[0.08] bg-white/[0.03] px-2 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em] text-zinc-400 transition hover:border-white/[0.11] hover:bg-white/[0.05] hover:text-zinc-200",
            className,
          )}
        >
          <Layers className="h-3.5 w-3.5 text-zinc-500" aria-hidden />
          <span className="hidden sm:inline">Categories</span>
          <ChevronDown className="h-3 w-3 text-zinc-600" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="max-h-[min(72vh,420px)] w-[min(calc(100vw-1.25rem),17rem)] overflow-y-auto"
      >
        <DropdownMenuLabel className="normal-case tracking-normal text-[10px] text-zinc-500">
          Categories
        </DropdownMenuLabel>
        {MARKET_CATEGORIES.map((cat) => (
          <DropdownMenuItem key={cat.slug} asChild>
            <PrefetchLink
              href={`${ROUTES.markets}?cat=${encodeURIComponent(cat.slug)}`}
              className="flex cursor-pointer items-start gap-2 py-1.5"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[3px] bg-white/[0.05] ring-1 ring-white/[0.06]">
                <cat.icon className="h-3 w-3 text-cyan-400/85" aria-hidden />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5 leading-tight">
                <span className="text-[11px] font-semibold text-zinc-100">{cat.name}</span>
                <span className="line-clamp-2 text-[9px] leading-snug text-zinc-500">{cat.blurb}</span>
              </span>
            </PrefetchLink>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <PrefetchLink href={ROUTES.marketsBrowse} className="cursor-pointer font-mono text-[10px] uppercase tracking-wide text-zinc-400">
            Full explorer
          </PrefetchLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <PrefetchLink href={ROUTES.marketsTrending} className="cursor-pointer font-mono text-[10px] uppercase tracking-wide text-zinc-400">
            Trending tape
          </PrefetchLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
