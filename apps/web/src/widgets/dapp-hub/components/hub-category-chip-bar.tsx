"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCategoryOverviewQuery } from "@/shared/api/hooks";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";

function hubCategoryHref(slug: string | null): string {
  if (!slug) return ROUTES.dapp;
  const qs = new URLSearchParams({ cat: slug });
  return `${ROUTES.dapp}?${qs.toString()}`;
}

/** Sticky category chips — Polymarket-style; filters `/dapp` in place via `?cat=`. */
export function HubCategoryChipBar() {
  const categoriesQ = useCategoryOverviewQuery();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCat = searchParams?.get("cat");
  const onHub = pathname === ROUTES.dapp || pathname?.startsWith(`${ROUTES.dapp}/`);
  const trendingActive = onHub && !activeCat;

  return (
    <div className="hub-category-bar sticky top-0 z-20 border-b border-[var(--hub-border)] bg-[rgba(10,22,40,0.92)] backdrop-blur-md">
      <div className="hub-container py-2.5">
        <div className="hub-category-chips" role="tablist" aria-label="Market categories">
          <Link
            href={ROUTES.dapp}
            role="tab"
            aria-selected={trendingActive}
            className={cn("hub-category-chip", trendingActive && "hub-category-chip--active")}
          >
            Trending
          </Link>
          {categoriesQ.isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="hub-skeleton h-8 w-20 shrink-0 rounded-full" />
              ))
            : (categoriesQ.data ?? [])
                .filter((cat) => cat.marketCount > 0)
                .map((cat) => (
                  <Link
                    key={cat.slug}
                    href={hubCategoryHref(cat.slug)}
                    role="tab"
                    aria-selected={activeCat === cat.slug}
                    className={cn(
                      "hub-category-chip",
                      activeCat === cat.slug && "hub-category-chip--active",
                    )}
                  >
                    {cat.name}
                  </Link>
                ))}
          <Link href={ROUTES.markets} className="hub-category-chip hub-category-chip--muted">
            All markets
          </Link>
        </div>
      </div>
    </div>
  );
}
