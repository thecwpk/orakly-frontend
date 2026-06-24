"use client";

import Link from "next/link";
import { useCategoryOverviewQuery } from "@/shared/api/hooks";
import { ROUTES } from "@/shared/constants/routes";
import { fmtCount, fmtUsdCompact } from "../lib/format-hub-metrics";
import { HubSectionRetry } from "./hub-section-retry";
import { HubSectionShell } from "./hub-section-shell";

export function HubCategoriesGrid() {
  const categoriesQ = useCategoryOverviewQuery();
  const maxVol = Math.max(1, ...(categoriesQ.data ?? []).map((c) => c.totalVolumeUsd));

  return (
    <HubSectionShell
      className="hub-section--mobile-reorder-categories hub-section-glass"
      title="Categories"
    >
      {categoriesQ.isLoading ? (
        <div className="hub-categories-scroll">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="hub-skeleton h-24 rounded-[var(--hub-radius)]" />
          ))}
        </div>
      ) : categoriesQ.isError ? (
        <HubSectionRetry onRetry={() => void categoriesQ.refetch()} />
      ) : (
        <div className="hub-categories-scroll">
          {(categoriesQ.data ?? []).map((cat) => {
            const volPct = Math.max(10, (cat.totalVolumeUsd / maxVol) * 100);
            return (
              <Link
                key={cat.slug}
                href={`${ROUTES.markets}?cat=${encodeURIComponent(cat.slug)}&trending=0`}
                className="hub-card hub-card-interactive block p-3"
              >
                <p className="text-sm font-semibold text-[var(--hub-fg)]">{cat.name}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[rgba(15,30,55,0.85)]">
                  <div
                    className="h-full rounded-full bg-[var(--hub-primary)]"
                    style={{ width: `${volPct}%` }}
                  />
                </div>
                <p className="mt-2 flex items-center justify-between text-[11px] text-[var(--hub-muted)]">
                  <span>{fmtCount(cat.marketCount)} mkts</span>
                  <span className="font-mono tabular-nums">{fmtUsdCompact(cat.totalVolumeUsd)}</span>
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </HubSectionShell>
  );
}
