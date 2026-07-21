"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheck, Flame, Sparkles, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import {
  fetchCommunitySuggestions,
  voteCommunitySuggestion,
} from "@/shared/api/fetchers/community-suggestions";
import { fetchCreatorLeaderboard } from "@/shared/api/fetchers/leaderboard";
import { queryKeys } from "@/shared/api/query-keys";
import { ROUTES } from "@/shared/constants/routes";
import type { CommunitySuggestion } from "@/shared/contracts/community-suggestion";
import { SubmitMarketModal } from "@/widgets/community-markets/submit-market-modal";

const LIMIT = 3;
const REFETCH_MS = 60_000;

function shortenAddress(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatCategory(category: string): string {
  if (!category) return "General";
  return category
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function formatCount(n: number): string {
  return Math.max(0, Math.floor(n)).toLocaleString("en-US");
}

function avatarColorFromAddress(addr: string): string {
  const cleaned = addr.replace(/^0x/i, "").replace(/[^0-9a-fA-F]/g, "");
  const hex = `${cleaned}000000`.slice(0, 6);
  return `#${hex}`;
}

function avatarInitials(addr: string): string {
  const cleaned = addr.replace(/^0x/i, "");
  return (cleaned.slice(0, 2) || "??").toUpperCase();
}

function ColumnCard({
  title,
  children,
  footer,
}: {
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="hub-dapp-column">
      <h3 className="hub-dapp-column-title">{title}</h3>
      {children}
      {footer}
    </div>
  );
}

function EmptyColumn({ label = "No submissions yet." }: { label?: string }) {
  return <p className="py-8 text-center text-xs text-[var(--hub-muted)]">{label}</p>;
}

function ColumnSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="space-y-2 border-b border-[var(--hub-border)] pb-3 last:border-0"
        >
          <div className="hub-dapp-skel h-3.5 w-full" />
          <div className="hub-dapp-skel h-3 w-2/3" />
          <div className="flex justify-between gap-2">
            <div className="hub-dapp-skel h-7 w-16 rounded-md" />
            <div className="hub-dapp-skel h-7 w-14 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MostVotedItem({
  suggestion,
  walletAddress,
  queryKey,
  isLast,
}: {
  suggestion: CommunitySuggestion;
  walletAddress: string | null;
  queryKey: readonly unknown[];
  isLast?: boolean;
}) {
  const qc = useQueryClient();
  const normalizedWallet = walletAddress?.toLowerCase() ?? null;
  const hasVoted =
    normalizedWallet != null &&
    suggestion.voterAddresses.some((addr) => addr.toLowerCase() === normalizedWallet);

  const voteMutation = useMutation({
    mutationFn: () => voteCommunitySuggestion(suggestion.id),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<CommunitySuggestion[]>(queryKey);

      qc.setQueryData<CommunitySuggestion[]>(queryKey, (current) =>
        (current ?? []).map((item) => {
          if (item.id !== suggestion.id || !normalizedWallet) return item;

          const voted = item.voterAddresses.some(
            (addr) => addr.toLowerCase() === normalizedWallet,
          );

          if (voted) {
            return {
              ...item,
              voteCount: Math.max(0, item.voteCount - 1),
              voterAddresses: item.voterAddresses.filter(
                (addr) => addr.toLowerCase() !== normalizedWallet,
              ),
            };
          }

          return {
            ...item,
            voteCount: item.voteCount + 1,
            voterAddresses: [...item.voterAddresses, normalizedWallet],
          };
        }),
      );

      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(queryKey, context.previous);
      }
      toast.error("Unable to register your vote. Connect your wallet and try again.");
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.hub.communityDiscovery("votes", LIMIT) });
      void qc.invalidateQueries({ queryKey: queryKeys.hub.communityDiscovery("newest", LIMIT) });
      void qc.invalidateQueries({
        queryKey: [...queryKeys.hub.communityDiscovery("newest", LIMIT), "approved"],
      });
    },
  });

  const title = suggestion.question || suggestion.title;

  return (
    <div
      className={cn(
        "hub-dapp-suggest-row",
        isLast && "hub-dapp-suggest-row--last",
      )}
    >
      <p className="hub-dapp-suggest-title">{title}</p>
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-baseline gap-1.5">
          <span className="hub-dapp-suggest-vote-val">
            {formatCount(suggestion.voteCount)}
          </span>
          <span className="hub-dapp-suggest-vote-label">votes</span>
        </p>
        <button
          type="button"
          disabled={voteMutation.isPending}
          onClick={() => {
            if (!normalizedWallet) {
              toast.message("Connect your wallet to vote.");
              return;
            }
            voteMutation.mutate();
          }}
          className={cn(
            "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
            hasVoted
              ? "border border-[var(--hub-primary)]/40 bg-[var(--hub-primary-soft)] text-[var(--hub-primary-bright)]"
              : "border border-[var(--hub-border)] text-[var(--hub-primary-bright)] hover:bg-[var(--hub-primary-soft)]",
          )}
        >
          {hasVoted ? "Voted" : "Vote"}
        </button>
      </div>
    </div>
  );
}

function SuggestionListItem({
  suggestion,
  isLast,
  showVotes,
}: {
  suggestion: CommunitySuggestion;
  isLast?: boolean;
  showVotes?: boolean;
}) {
  const title = suggestion.question || suggestion.title;
  const submitter = suggestion.creatorAddress
    ? `by ${shortenAddress(suggestion.creatorAddress)}`
    : "by Anonymous";
  const marketHref = suggestion.marketSlug
    ? ROUTES.market(suggestion.marketSlug)
    : null;

  const body = (
    <div
      className={cn(
        "hub-dapp-suggest-row",
        isLast && "hub-dapp-suggest-row--last",
      )}
    >
      <p className="hub-dapp-suggest-title">{title}</p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="hub-dapp-market-chip">
          {formatCategory(suggestion.category)}
        </span>
        <span className="font-mono text-xs text-[var(--hub-muted)]">{submitter}</span>
        {showVotes ? (
          <span className="hub-dapp-stat-value hub-dapp-stat-value--sm !inline text-[var(--hub-muted)]">
            {formatCount(suggestion.voteCount)} votes
          </span>
        ) : null}
      </div>
    </div>
  );

  if (marketHref) {
    return (
      <Link href={marketHref} className="hub-dapp-suggest-row--link">
        {body}
      </Link>
    );
  }
  return body;
}

/**
 * Section 5 — Community Discovery: suggestions + top creators + submit form.
 */
export function CommunityDiscovery() {
  const { address } = useAccount();
  const walletAddress = address ?? null;
  const qc = useQueryClient();
  const [submitOpen, setSubmitOpen] = useState(false);

  const mostVotedKey = queryKeys.hub.communityDiscovery("votes", LIMIT);
  const newestKey = queryKeys.hub.communityDiscovery("newest", LIMIT);
  const approvedKey = [...queryKeys.hub.communityDiscovery("newest", LIMIT), "approved"] as const;

  const mostVotedQuery = useQuery({
    queryKey: mostVotedKey,
    queryFn: () =>
      fetchCommunitySuggestions({ status: "pending", sort: "votes", limit: LIMIT }),
    staleTime: 30_000,
    refetchInterval: REFETCH_MS,
  });

  const newestQuery = useQuery({
    queryKey: newestKey,
    queryFn: () =>
      fetchCommunitySuggestions({ status: "pending", sort: "newest", limit: LIMIT }),
    staleTime: 30_000,
    refetchInterval: REFETCH_MS,
  });

  const approvedQuery = useQuery({
    queryKey: approvedKey,
    queryFn: () =>
      fetchCommunitySuggestions({ status: "approved", sort: "newest", limit: LIMIT }),
    staleTime: 30_000,
    refetchInterval: REFETCH_MS,
  });

  const creatorsQuery = useQuery({
    queryKey: queryKeys.hub.topCreators(LIMIT),
    queryFn: () => fetchCreatorLeaderboard(LIMIT),
    staleTime: 30_000,
    refetchInterval: REFETCH_MS,
  });

  const mostVoted = (mostVotedQuery.data ?? []).slice(0, LIMIT);
  const newest = (newestQuery.data ?? []).slice(0, LIMIT);
  const approved = (approvedQuery.data ?? []).slice(0, LIMIT);
  const creators = (creatorsQuery.data ?? []).slice(0, LIMIT);

  const openSubmit = () => setSubmitOpen(true);

  const onSubmitSuccess = () => {
    void qc.invalidateQueries({ queryKey: mostVotedKey });
    void qc.invalidateQueries({ queryKey: newestKey });
    void qc.invalidateQueries({ queryKey: approvedKey });
  };

  return (
    <section className="hub-section" aria-label="Community Discovery">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="hub-section-title">Community Discovery</h2>
          <p className="hub-section-sub mt-0.5 block">
            Markets proposed and ranked by the community.
          </p>
        </div>
        <button
          type="button"
          onClick={openSubmit}
          className="hub-dapp-cta hub-dapp-cta--solid !mt-0 !w-auto shrink-0 px-4"
        >
          Submit Market Idea
        </button>
      </div>

      <div className="hub-dapp-grid-community mt-4">
        {/* Most Voted Suggestions */}
        <ColumnCard
          title={
            <span className="inline-flex items-center gap-2">
              <Flame className="size-4 text-orange-400" aria-hidden />
              Most Voted Suggestions
            </span>
          }
          footer={
            <Link
              href={ROUTES.marketsCommunity}
              className="mt-4 block text-xs text-[var(--hub-muted)] transition-colors hover:text-[var(--hub-fg)]"
            >
              View all →
            </Link>
          }
        >
          {mostVotedQuery.isLoading && mostVoted.length === 0 ? (
            <ColumnSkeleton />
          ) : mostVoted.length === 0 ? (
            <EmptyColumn />
          ) : (
            mostVoted.map((s, i) => (
              <MostVotedItem
                key={s.id}
                suggestion={s}
                walletAddress={walletAddress}
                queryKey={mostVotedKey}
                isLast={i === mostVoted.length - 1}
              />
            ))
          )}
        </ColumnCard>

        {/* Newest Suggestions (spec name — was "Just Submitted") */}
        <ColumnCard
          title={
            <span className="inline-flex items-center gap-2">
              <Sparkles className="size-4 text-blue-300" aria-hidden />
              Newest Suggestions
            </span>
          }
          footer={
            <Link
              href={ROUTES.marketsCommunity}
              className="mt-4 block text-xs text-[var(--hub-muted)] transition-colors hover:text-[var(--hub-fg)]"
            >
              View all →
            </Link>
          }
        >
          {newestQuery.isLoading && newest.length === 0 ? (
            <ColumnSkeleton />
          ) : newest.length === 0 ? (
            <EmptyColumn />
          ) : (
            newest.map((s, i) => (
              <SuggestionListItem
                key={s.id}
                suggestion={s}
                showVotes
                isLast={i === newest.length - 1}
              />
            ))
          )}
        </ColumnCard>

        {/* Recently Approved Suggestions — distinct from newest */}
        <ColumnCard
          title={
            <span className="inline-flex items-center gap-2">
              <CircleCheck className="size-4 text-emerald-400" aria-hidden />
              Recently Approved
            </span>
          }
          footer={
            <Link
              href={ROUTES.marketsCommunity}
              className="mt-4 block text-xs text-[var(--hub-muted)] transition-colors hover:text-[var(--hub-fg)]"
            >
              View all →
            </Link>
          }
        >
          {approvedQuery.isLoading && approved.length === 0 ? (
            <ColumnSkeleton />
          ) : approved.length === 0 ? (
            <EmptyColumn label="No approved suggestions yet." />
          ) : (
            approved.map((s, i) => (
              <SuggestionListItem
                key={s.id}
                suggestion={s}
                isLast={i === approved.length - 1}
              />
            ))
          )}
        </ColumnCard>

        {/* Top Creators */}
        <ColumnCard
          title={
            <span className="inline-flex items-center gap-2">
              <Trophy className="size-4 text-amber-400" aria-hidden />
              Top Creators
            </span>
          }
          footer={
            <Link
              href={ROUTES.LEADERBOARD}
              className="mt-4 block text-xs text-[var(--hub-muted)] transition-colors hover:text-[var(--hub-fg)]"
            >
              Full leaderboard →
            </Link>
          }
        >
          {creatorsQuery.isLoading && creators.length === 0 ? (
            <ColumnSkeleton />
          ) : creators.length === 0 ? (
            <EmptyColumn label="No creators ranked yet." />
          ) : (
            creators.map((creator, index) => (
              <div
                key={creator.creatorAddress}
                className={cn(
                  "hub-dapp-suggest-row flex items-center gap-3 !border-b-[var(--hub-border)]",
                  index === creators.length - 1 && "hub-dapp-suggest-row--last",
                )}
              >
                <span className="w-6 shrink-0 text-lg font-black tabular-nums text-[var(--hub-muted)]">
                  {index + 1}
                </span>
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: avatarColorFromAddress(creator.creatorAddress) }}
                  aria-hidden
                >
                  {avatarInitials(creator.creatorAddress)}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={ROUTES.traderProfile(creator.creatorAddress)}
                    className="block truncate font-mono text-sm text-[var(--hub-fg)] transition hover:text-[var(--hub-primary-bright)]"
                  >
                    {shortenAddress(creator.creatorAddress)}
                  </Link>
                  <p className="mt-0.5">
                    <span className="hub-dapp-stat-value hub-dapp-stat-value--sm !inline">
                      {formatCount(creator.marketCount)}
                    </span>{" "}
                    <span className="hub-dapp-stat-label !inline !normal-case !tracking-normal">
                      market{creator.marketCount === 1 ? "" : "s"} created
                    </span>
                  </p>
                </div>
              </div>
            ))
          )}
        </ColumnCard>
      </div>

      <div className="hub-dapp-banner">
        <div className="min-w-0">
          <p className="text-lg font-semibold text-[var(--hub-fg)]">
            Have a market idea?
          </p>
          <p className="mt-1 text-sm text-[var(--hub-muted)]">
            Submit a proposal. If the community approves it, the market can go live.
          </p>
        </div>
        <button
          type="button"
          onClick={openSubmit}
          className="hub-dapp-cta hub-dapp-cta--solid !mt-0 shrink-0 px-6 sm:!w-auto"
        >
          Submit Market Idea
        </button>
      </div>

      <SubmitMarketModal
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        onSuccess={onSubmitSuccess}
      />
    </section>
  );
}
