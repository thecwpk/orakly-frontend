"use client";

import Link from "next/link";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useMarketSuggestionsQuery } from "@/shared/api/hooks";
import { useVoteSuggestionMutation } from "@/shared/api/hooks/useVoteSuggestionMutation";
import { useIsAuthenticated } from "@/state/selectors/auth.selectors";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { HubSectionRetry } from "./hub-section-retry";
import { HubSectionShell } from "./hub-section-shell";

export function HubCommunityIntelligence() {
  const suggestionsQ = useMarketSuggestionsQuery(6);
  const vote = useVoteSuggestionMutation();
  const isAuthed = useIsAuthenticated();
  const maxVotes = Math.max(
    1,
    ...(suggestionsQ.data ?? []).map((s) => s.votesUp + s.votesDown),
  );

  return (
    <HubSectionShell
      className="hub-section--mobile-reorder-community hub-section-glass"
      title="Community"
      action={
        <Link href={ROUTES.marketCreate} className="hub-btn-primary px-3 py-1.5 text-xs">
          + Suggest
        </Link>
      }
    >
      <div className="hub-card divide-y divide-[var(--hub-border)] overflow-hidden">
        {suggestionsQ.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-4 py-3">
              <div className="hub-skeleton h-10 w-full" />
            </div>
          ))
        ) : suggestionsQ.isError ? (
          <p className="px-4 py-6">
            <HubSectionRetry onRetry={() => void suggestionsQ.refetch()} />
          </p>
        ) : (suggestionsQ.data ?? []).length === 0 ? (
          <p className="text-sm text-[var(--hub-muted)]">No suggestions yet.</p>
        ) : (
          (suggestionsQ.data ?? []).map((s) => {
            const total = s.votesUp + s.votesDown;
            const upPct = total > 0 ? (s.votesUp / total) * 100 : 50;
            return (
              <div
                key={s.id}
                className="grid gap-2 px-4 py-3 transition hover:bg-[var(--hub-primary-soft)] sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-medium text-[var(--hub-fg)]">{s.title}</p>
                  <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-[rgba(15,30,55,0.85)]">
                    <div
                      className="h-full bg-[var(--hub-primary)]"
                      style={{ width: `${(total / maxVotes) * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 flex h-1 overflow-hidden rounded-full bg-[rgba(15,30,55,0.6)]">
                    <div className="h-full bg-[var(--hub-success)]" style={{ width: `${upPct}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!isAuthed || vote.isPending}
                    onClick={() => vote.mutate({ suggestionId: s.id, direction: "UP" })}
                    className={cn(
                      "hub-btn-secondary inline-flex items-center gap-1 px-2 py-1 text-xs",
                      !isAuthed && "opacity-50",
                    )}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
                    {s.votesUp}
                  </button>
                  <button
                    type="button"
                    disabled={!isAuthed || vote.isPending}
                    onClick={() => vote.mutate({ suggestionId: s.id, direction: "DOWN" })}
                    className={cn(
                      "hub-btn-secondary inline-flex items-center gap-1 px-2 py-1 text-xs",
                      !isAuthed && "opacity-50",
                    )}
                  >
                    <ThumbsDown className="h-3.5 w-3.5" aria-hidden />
                    {s.votesDown}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </HubSectionShell>
  );
}

