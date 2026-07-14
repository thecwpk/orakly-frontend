"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { LeaderboardAvatar } from "@/features/leaderboard/components/leaderboard-avatar";
import { cn } from "@/lib/utils";
import {
  fetchCommunitySuggestions,
  voteCommunitySuggestion,
} from "@/shared/api/fetchers/community-suggestions";
import { fetchCreatorLeaderboard } from "@/shared/api/fetchers/leaderboard";
import { queryKeys } from "@/shared/api/query-keys";
import { ROUTES } from "@/shared/constants/routes";
import type { CommunitySuggestion } from "@/shared/contracts/community-suggestion";

const LIMIT = 3;
const REFETCH_MS = 60_000;

function shortenAddress(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatCategory(category: string): string {
  if (!category) return "General";
  return category
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function formatFeesBnb(fees: number): string {
  if (!Number.isFinite(fees) || fees <= 0) return "0 BNB earned";
  if (fees >= 1000) return `${(fees / 1000).toFixed(1)}k BNB earned`;
  if (fees >= 100) return `${Math.round(fees)} BNB earned`;
  return `${fees.toFixed(2)} BNB earned`;
}

function MostVotedItem({
  suggestion,
  walletAddress,
  queryKey,
}: {
  suggestion: CommunitySuggestion;
  walletAddress: string | null;
  queryKey: readonly unknown[];
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
    },
  });

  return (
    <div className="border-b border-[var(--hub-border)] py-3 last:border-b-0">
      <p className="line-clamp-2 text-[13px] font-medium text-[var(--hub-fg)]">
        {suggestion.question}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[13px] text-[var(--hub-muted)]">
          <span className="font-bold text-[var(--hub-fg)]">{suggestion.voteCount}</span>{" "}
          votes
        </p>
        <button
          type="button"
          disabled={voteMutation.isPending}
          onClick={() => {
            if (!normalizedWallet) {
              toast.message("Connect your wallet to vote");
              return;
            }
            voteMutation.mutate();
          }}
          className={cn(
            "inline-flex shrink-0 items-center rounded-lg px-2.5 py-1 text-[12px] font-semibold transition",
            hasVoted
              ? "bg-[var(--hub-success-bg)] text-[var(--hub-success)] ring-1 ring-emerald-400/30"
              : "border border-[var(--hub-border)] text-[var(--hub-fg)] hover:border-[var(--hub-border-strong)] hover:bg-[var(--hub-card-hover)]",
          )}
        >
          {hasVoted ? "✓ Voted" : "Vote ↑"}
        </button>
      </div>
    </div>
  );
}

function NewestItem({ suggestion }: { suggestion: CommunitySuggestion }) {
  const submitter = suggestion.creatorAddress
    ? shortenAddress(suggestion.creatorAddress)
    : "Anonymous";

  return (
    <div className="border-b border-[var(--hub-border)] py-3 last:border-b-0">
      <p className="line-clamp-2 text-[13px] text-[var(--hub-fg)]">{suggestion.question}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[var(--hub-muted)]">
        <span className="rounded-md bg-white/[0.06] px-2 py-0.5 font-medium text-zinc-300 ring-1 ring-white/[0.08]">
          {formatCategory(suggestion.category)}
        </span>
        <span>by {submitter}</span>
        <span>{suggestion.voteCount} votes</span>
      </div>
    </div>
  );
}

/**
 * Section 5 — Community Discovery: suggestions + top creators.
 */
export function CommunityDiscovery() {
  const router = useRouter();
  const { address } = useAccount();
  const walletAddress = address ?? null;

  const mostVotedKey = queryKeys.hub.communityDiscovery("votes", LIMIT);
  const newestKey = queryKeys.hub.communityDiscovery("newest", LIMIT);

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

  const creatorsQuery = useQuery({
    queryKey: queryKeys.hub.topCreators(LIMIT),
    queryFn: () => fetchCreatorLeaderboard(LIMIT),
    staleTime: 30_000,
    refetchInterval: REFETCH_MS,
  });

  const mostVoted = (mostVotedQuery.data ?? []).slice(0, LIMIT);
  const newest = (newestQuery.data ?? []).slice(0, LIMIT);
  const creators = (creatorsQuery.data ?? []).slice(0, LIMIT);

  function goCommunity() {
    router.push(ROUTES.marketsCommunity);
  }

  return (
    <section className="hub-section" aria-label="Community Discovery">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight text-[var(--hub-fg)]">
            Community Discovery
          </h2>
          <p className="mt-1 text-[13px] text-[var(--hub-muted)]">
            Markets the community wants to see
          </p>
        </div>
        <button type="button" onClick={goCommunity} className="hub-btn-primary px-4 py-2 text-sm">
          Submit Market →
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Column 1 — Most Voted */}
        <div>
          <h3 className="mb-2 text-[14px] font-medium text-[var(--hub-fg)]">🔥 Most Voted</h3>
          {mostVotedQuery.isLoading && mostVoted.length === 0 ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="hub-skeleton h-16 rounded-lg" />
              ))}
            </div>
          ) : mostVoted.length === 0 ? (
            <p className="py-6 text-[13px] text-[var(--hub-muted)]">No suggestions yet</p>
          ) : (
            mostVoted.map((s) => (
              <MostVotedItem
                key={s.id}
                suggestion={s}
                walletAddress={walletAddress}
                queryKey={mostVotedKey}
              />
            ))
          )}
          <Link
            href={ROUTES.marketsCommunity}
            className="mt-3 inline-flex text-[13px] font-medium text-[var(--hub-primary-bright)] transition hover:underline"
          >
            View all →
          </Link>
        </div>

        {/* Column 2 — Newest */}
        <div>
          <h3 className="mb-2 text-[14px] font-medium text-[var(--hub-fg)]">🆕 Just Submitted</h3>
          {newestQuery.isLoading && newest.length === 0 ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="hub-skeleton h-16 rounded-lg" />
              ))}
            </div>
          ) : newest.length === 0 ? (
            <p className="py-6 text-[13px] text-[var(--hub-muted)]">No suggestions yet</p>
          ) : (
            newest.map((s) => <NewestItem key={s.id} suggestion={s} />)
          )}
          <Link
            href={ROUTES.marketsCommunity}
            className="mt-3 inline-flex text-[13px] font-medium text-[var(--hub-primary-bright)] transition hover:underline"
          >
            Submit idea →
          </Link>
        </div>

        {/* Column 3 — Top Creators */}
        <div>
          <h3 className="mb-2 text-[14px] font-medium text-[var(--hub-fg)]">🏆 Top Creators</h3>
          {creatorsQuery.isLoading && creators.length === 0 ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="hub-skeleton h-14 rounded-lg" />
              ))}
            </div>
          ) : creators.length === 0 ? (
            <p className="py-6 text-[13px] text-[var(--hub-muted)]">No creators yet</p>
          ) : (
            creators.map((creator, index) => (
              <div
                key={creator.creatorAddress}
                className="flex items-center gap-3 border-b border-[var(--hub-border)] py-3 last:border-b-0"
              >
                <span className="w-6 shrink-0 text-[20px] font-bold text-[var(--hub-muted)]">
                  {index + 1}
                </span>
                <LeaderboardAvatar
                  address={creator.creatorAddress}
                  className="h-8 w-8 rounded-full"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[13px] font-medium text-[var(--hub-fg)]">
                    {shortenAddress(creator.creatorAddress)}
                  </p>
                  <p className="text-[11px] text-[var(--hub-muted)]">
                    {creator.marketCount} market{creator.marketCount === 1 ? "" : "s"} approved
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-[var(--hub-success-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--hub-success)]">
                  {formatFeesBnb(creator.feesEarned)}
                </span>
              </div>
            ))
          )}
          <Link
            href={ROUTES.LEADERBOARD}
            className="mt-3 inline-flex text-[13px] font-medium text-[var(--hub-primary-bright)] transition hover:underline"
          >
            Full leaderboard →
          </Link>
        </div>
      </div>

      <div
        className={cn(
          "mt-6 flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between",
          "bg-gradient-to-r from-[var(--hub-primary)]/35 via-[var(--hub-bg-elevated)] to-[var(--hub-card)]",
          "ring-1 ring-[var(--hub-border)]",
        )}
      >
        <div>
          <p className="text-[18px] font-semibold text-[var(--hub-fg)]">
            Have an idea for a market?
          </p>
          <p className="mt-1 text-[13px] text-[var(--hub-muted)]">
            Submit it. If the community votes it up, it goes live.
          </p>
        </div>
        <button
          type="button"
          onClick={goCommunity}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
        >
          Submit Market Idea
        </button>
      </div>
    </section>
  );
}
