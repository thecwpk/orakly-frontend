"use client";

import Link from "next/link";
import { useCategoryOverviewQuery } from "@/shared/api/hooks";
import { ROUTES } from "@/shared/constants/routes";
import { fmtCount, fmtUsdCompact } from "../lib/format-hub-metrics";
import { HubSectionRetry } from "./hub-section-retry";
import { HubSectionShell } from "./hub-section-shell";

export function HubCategoriesGrid() {
  const categoriesQ = useCategoryOverviewQuery();

  return (
    <HubSectionShell
      className="hub-section--mobile-reorder-categories hub-section-glass"
      title="Market Categories"
      subtitle="Browse by narrative taxonomy."
    >
      {categoriesQ.isLoading ? (
        <div className="grid gap-[var(--hub-card-gap)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="hub-skeleton h-32 rounded-[var(--hub-radius)]" />
          ))}
        </div>
      ) : categoriesQ.isError ? (
        <HubSectionRetry onRetry={() => void categoriesQ.refetch()} />
      ) : (
        <div className="grid gap-[var(--hub-card-gap)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {(categoriesQ.data ?? []).map((cat) => (
            <Link
              key={cat.slug}
              href={`${ROUTES.markets}?category=${encodeURIComponent(cat.slug)}`}
              className="hub-card block p-4 transition hover:border-[var(--hub-muted)]"
            >
              <p className="text-sm font-semibold text-[var(--hub-fg)]">{cat.name}</p>
              <p className="mt-2 text-xs text-[var(--hub-muted)]">
                {fmtCount(cat.marketCount)} markets · {fmtUsdCompact(cat.totalVolumeUsd)}
              </p>
              <p className="mt-2 text-xs text-[var(--hub-muted)]">
                Top:{" "}
                <span className="text-[var(--hub-attention)]">
                  {cat.topNarrative ?? "—"}
                </span>
              </p>
            </Link>
          ))}
        </div>
      )}
    </HubSectionShell>
  );
}
