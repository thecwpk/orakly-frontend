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

type HubCategoryChipBarProps = {
  /** When true, renders only the tab row (parent provides sticky chrome). */
  embedded?: boolean;
};

/** Primary category tabs — Polymarket text style, same-page `/dapp` filters. */
export function HubCategoryChipBar({ embedded = false }: HubCategoryChipBarProps) {
  const topicsQ = useHubTopicsQuery();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCat = searchParams?.get("cat");
  const activeNarrative = searchParams?.get("narrative");
  const activeBreaking = searchParams?.get("breaking") === "1";
  const onHub = pathname === ROUTES.dapp || pathname?.startsWith(`${ROUTES.dapp}/`);
  const trendingActive = onHub && !activeCat && !activeNarrative && !activeBreaking;

  const chips = topicsQ.data ?? [];

  const tabs = (
    <div className="hub-category-tabs" role="tablist" aria-label="Market topics">
      <Link
        href={ROUTES.dapp}
        role="tab"
        aria-selected={trendingActive}
        className={cn("hub-category-tab", trendingActive && "hub-category-tab--active")}
      >
        Trending
      </Link>
      {topicsQ.isLoading
        ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="hub-skeleton h-5 w-16 shrink-0 rounded" />
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
                className={cn("hub-category-tab", active && "hub-category-tab--active")}
              >
                {chip.label}
                {chip.trend === "RISING" ? (
                  <span className="ml-0.5 text-[10px] font-bold text-emerald-600" aria-hidden>
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
          className="hub-category-tab hub-category-tab--active"
        >
          {activeCat.replace(/-/g, " ")}
        </Link>
      ) : null}
      <Link href={ROUTES.markets} className="hub-category-tab hub-category-tab--muted">
        More
      </Link>
    </div>
  );

  if (embedded) {
    return <div className="hub-container py-0">{tabs}</div>;
  }

  return (
    <div className="hub-feed-chrome">
      <div className="hub-container py-2">{tabs}</div>
    </div>
  );
}
