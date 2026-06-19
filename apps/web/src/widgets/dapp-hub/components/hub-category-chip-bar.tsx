"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCategoryOverviewQuery } from "@/shared/api/hooks";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";

/** Sticky category chips — Polymarket-style filter rail under the header. */
export function HubCategoryChipBar() {
  const categoriesQ = useCategoryOverviewQuery();
  const pathname = usePathname();
  const onHub = pathname === ROUTES.dapp || pathname?.startsWith(`${ROUTES.dapp}/`);

  return (
    <div className="hub-category-bar sticky top-0 z-20 border-b border-[var(--hub-border)] bg-[rgba(10,22,40,0.92)] backdrop-blur-md">
      <div className="hub-container py-2.5">
        <div className="hub-category-chips" role="tablist" aria-label="Market categories">
          <Link
            href={ROUTES.dapp}
            role="tab"
            aria-selected={onHub}
            className={cn("hub-category-chip", onHub && "hub-category-chip--active")}
          >
            Trending
          </Link>
          {categoriesQ.isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="hub-skeleton h-8 w-20 shrink-0 rounded-full" />
              ))
            : (categoriesQ.data ?? []).map((cat) => (
                <Link
                  key={cat.slug}
                  href={`${ROUTES.markets}?category=${encodeURIComponent(cat.slug)}`}
                  role="tab"
                  aria-selected={false}
                  className="hub-category-chip"
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
