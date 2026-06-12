"use client";

import Link from "next/link";
import { useMarketSuggestionsQuery } from "@/shared/api/hooks";
import { ROUTES } from "@/shared/constants/routes";
import { HubSectionShell } from "./hub-section-shell";

export function HubCommunityIntelligence() {
  const suggestionsQ = useMarketSuggestionsQuery(5);

  return (
    <HubSectionShell
      className="hub-section--desktop-only"
      title="Community Intelligence"
      subtitle="What is the crowd discovering?"
      action={
        <div className="flex gap-2">
          <Link
            href={ROUTES.marketCreate}
            className="rounded-lg bg-[var(--hub-success)] px-3 py-2 text-xs font-semibold text-[#090909]"
          >
            Suggest Market
          </Link>
          <Link
            href={ROUTES.marketCreate}
            className="rounded-lg border border-[var(--hub-border)] px-3 py-2 text-xs font-semibold text-[var(--hub-fg)]"
          >
            View All
          </Link>
        </div>
      }
    >
      <div className="hub-card divide-y divide-[var(--hub-border)]">
        {suggestionsQ.isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-3">
              <div className="hub-skeleton h-10 w-full" />
            </div>
          ))
        ) : (suggestionsQ.data ?? []).length === 0 ? (
          <p className="px-4 py-6 text-sm text-[var(--hub-muted)]">
            No community suggestions yet.
          </p>
        ) : (
          (suggestionsQ.data ?? []).map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--hub-fg)]">{s.title}</p>
                <p className="mt-0.5 text-xs text-[var(--hub-muted)]">
                  {s.creator} · {s.votesUp} votes
                </p>
              </div>
              <span className="rounded border border-[var(--hub-border)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--hub-muted)]">
                {s.status.replace("_", " ")}
              </span>
            </div>
          ))
        )}
      </div>
    </HubSectionShell>
  );
}
