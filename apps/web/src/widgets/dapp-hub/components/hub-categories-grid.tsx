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
      title="Browse by category"
      subtitle="Jump into a theme — crypto, sports, politics, and more."
    >
      {categoriesQ.isLoading ? (
        <div className="hub-categories-scroll">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="hub-skeleton h-28 rounded-[var(--hub-radius)]" />
          ))}
        </div>
      ) : categoriesQ.isError ? (
        <HubSectionRetry onRetry={() => void categoriesQ.refetch()} />
      ) : (
        <div className="hub-categories-scroll">
          {(categoriesQ.data ?? []).map((cat) => (
            <Link
              key={cat.slug}
              href={`${ROUTES.markets}?category=${encodeURIComponent(cat.slug)}`}
              className="hub-card hub-card-interactive block p-4"
            >
              <p className="text-sm font-semibold text-[var(--hub-fg)]">{cat.name}</p>
              <p className="mt-2 text-xs text-[var(--hub-muted)]">
                {fmtCount(cat.marketCount)} markets · {fmtUsdCompact(cat.totalVolumeUsd)}
              </p>
              {cat.topNarrative ? (
                <p className="mt-2 text-xs text-[var(--hub-muted)]">
                  Hot:{" "}
                  <span className="font-medium text-[var(--hub-primary-bright)]">
                    {cat.topNarrative}
                  </span>
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </HubSectionShell>
  );
}
