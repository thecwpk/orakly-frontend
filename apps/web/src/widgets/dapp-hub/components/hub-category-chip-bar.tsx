"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { HubTopicChip } from "@/shared/contracts/hub-home";
import { useHubTopicsQuery } from "@/shared/api/hooks";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";

function hubTopicHref(chip: HubTopicChip): string {
  if (chip.kind === "breaking") {
    const qs = new URLSearchParams({ breaking: "1" });
    return `${ROUTES.dapp}?${qs.toString()}`;
  }
  if (chip.kind === "narrative" && chip.slug) {
    const qs = new URLSearchParams({ narrative: chip.slug });
    return `${ROUTES.dapp}?${qs.toString()}`;
  }
  return ROUTES.dapp;
}

function hubCategoryHref(slug: string): string {
  const qs = new URLSearchParams({ cat: slug });
  return `${ROUTES.dapp}?${qs.toString()}`;
}

/** Sticky topic chips — Polymarket-style; narrative engine + same-page `/dapp` filters. */
export function HubCategoryChipBar() {
  const topicsQ = useHubTopicsQuery();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCat = searchParams?.get("cat");
  const activeNarrative = searchParams?.get("narrative");
  const activeBreaking = searchParams?.get("breaking") === "1";
  const onHub = pathname === ROUTES.dapp || pathname?.startsWith(`${ROUTES.dapp}/`);
  const trendingActive = onHub && !activeCat && !activeNarrative && !activeBreaking;

  const chips = topicsQ.data ?? [];

  return (
    <div className="hub-category-bar sticky top-0 z-20 border-b border-[var(--hub-border)] bg-[rgba(10,22,40,0.92)] backdrop-blur-md">
      <div className="hub-container py-2.5">
        <div className="hub-category-chips" role="tablist" aria-label="Market topics">
          <Link
            href={ROUTES.dapp}
            role="tab"
            aria-selected={trendingActive}
            className={cn("hub-category-chip", trendingActive && "hub-category-chip--active")}
          >
            Trending
          </Link>
          {topicsQ.isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="hub-skeleton h-8 w-20 shrink-0 rounded-full" />
              ))
            : chips.map((chip) => {
                const active =
                  (chip.kind === "breaking" && activeBreaking) ||
                  (chip.kind === "narrative" && activeNarrative === chip.slug);
                return (
                  <Link
                    key={chip.id}
                    href={hubTopicHref(chip)}
                    role="tab"
                    aria-selected={active}
                    className={cn("hub-category-chip", active && "hub-category-chip--active")}
                  >
                    {chip.label}
                    {chip.trend === "RISING" ? (
                      <span className="ml-1 text-[10px] text-emerald-400" aria-hidden>
                        ↑
                      </span>
                    ) : null}
                  </Link>
                );
              })}
          {activeCat ? (
            <Link
              href={hubCategoryHref(activeCat)}
              role="tab"
              aria-selected
              className="hub-category-chip hub-category-chip--active"
            >
              {activeCat.replace(/-/g, " ")}
            </Link>
          ) : null}
          <Link href={ROUTES.markets} className="hub-category-chip hub-category-chip--muted">
            All markets
          </Link>
        </div>
      </div>
    </div>
  );
}
