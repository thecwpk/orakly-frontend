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

function formatRelative(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs < 1) return "just now";
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function HubCommunityIntelligence() {
  const suggestionsQ = useMarketSuggestionsQuery(6);
  const vote = useVoteSuggestionMutation();
  const isAuthed = useIsAuthenticated();

  return (
    <HubSectionShell
      className="hub-section--mobile-reorder-community hub-section-glass"
      title="Community ideas"
      subtitle="Vote on market suggestions from other traders."
      action={
        <Link href={ROUTES.marketCreate} className="hub-btn-primary px-3 py-2 text-xs">
          Suggest market
        </Link>
      }
    >
      <div className="hub-card divide-y divide-[var(--hub-border)] overflow-hidden">
        {suggestionsQ.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-4 py-3">
              <div className="hub-skeleton h-12 w-full" />
            </div>
          ))
        ) : suggestionsQ.isError ? (
          <p className="px-4 py-6">
            <HubSectionRetry onRetry={() => void suggestionsQ.refetch()} />
          </p>
        ) : (suggestionsQ.data ?? []).length === 0 ? (
          <p className="px-4 py-6 text-sm text-[var(--hub-muted)]">
            No community suggestions yet — be the first to propose a market.
          </p>
        ) : (
          (suggestionsQ.data ?? []).map((s) => {
            const net = s.votesUp - s.votesDown;
            return (
              <div
                key={s.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 transition hover:bg-[var(--hub-primary-soft)]"
              >
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-[var(--hub-fg)]">{s.title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--hub-muted)]">
                    <span>by {s.creator}</span>
                    {s.narrative ? (
                      <span className="rounded-md border border-[var(--hub-border)] bg-[var(--hub-primary-soft)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--hub-primary-bright)]">
                        {s.narrative}
                      </span>
                    ) : null}
                    <span>{formatRelative(s.createdAt)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden font-mono text-xs tabular-nums text-[var(--hub-primary-bright)] sm:inline">
                    {net > 0 ? `+${net}` : net}
                  </span>
                  <button
                    type="button"
                    disabled={!isAuthed || vote.isPending}
                    title={isAuthed ? "Support" : "Sign in to vote"}
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
                    title={isAuthed ? "Not interested" : "Sign in to vote"}
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
