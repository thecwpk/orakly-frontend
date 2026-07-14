"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
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
  if (!Number.isFinite(fees) || fees <= 0) return "0 BNB";
  if (fees >= 1000) return `${(fees / 1000).toFixed(1)}k BNB`;
  if (fees >= 100) return `${Math.round(fees)} BNB`;
  return `${fees.toFixed(2)} BNB`;
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
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
        {title}
      </h3>
      {children}
      {footer}
    </div>
  );
}

function EmptyColumn({ label = "No submissions yet" }: { label?: string }) {
  return <p className="py-8 text-center text-xs text-slate-600">{label}</p>;
}

function ColumnSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-2 border-b border-white/5 pb-3 last:border-0">
          <div className="h-3.5 w-full rounded bg-white/10" />
          <div className="h-3 w-2/3 rounded bg-white/5" />
          <div className="flex justify-between">
            <div className="h-6 w-16 rounded bg-white/10" />
            <div className="h-6 w-14 rounded bg-white/5" />
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
    },
  });

  return (
    <div className={cn(!isLast && "mb-3 border-b border-white/5 pb-3")}>
      <p className="mb-2 line-clamp-2 text-sm font-medium text-slate-200">
        {suggestion.question}
      </p>
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-baseline">
          <span className="text-xl font-black text-white">{suggestion.voteCount}</span>
          <span className="ml-1 text-xs text-slate-500">votes</span>
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
            "shrink-0 rounded-lg px-3 py-1 text-xs transition-colors",
            hasVoted
              ? "border border-indigo-500/40 bg-indigo-500/20 text-indigo-300"
              : "border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10",
          )}
        >
          {hasVoted ? "✓ Voted" : "↑ Vote"}
        </button>
      </div>
    </div>
  );
}

function NewestItem({
  suggestion,
  isLast,
}: {
  suggestion: CommunitySuggestion;
  isLast?: boolean;
}) {
  const submitter = suggestion.creatorAddress
    ? `by ${shortenAddress(suggestion.creatorAddress)}`
    : "by Anonymous";

  return (
    <div className={cn(!isLast && "mb-3 border-b border-white/5 pb-3")}>
      <p className="mb-2 line-clamp-2 text-sm font-medium text-slate-200">
        {suggestion.question}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
          {formatCategory(suggestion.category)}
        </span>
        <span className="font-mono text-xs text-slate-500">{submitter}</span>
        <span className="text-xs text-slate-500">{suggestion.voteCount} votes</span>
      </div>
    </div>
  );
}

/**
 * Section 5 — Community Discovery: suggestions + top creators.
 */
export function CommunityDiscovery() {
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

  return (
    <section className="hub-section" aria-label="Community Discovery">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Community Discovery</h2>
          <p className="mt-0.5 block text-sm text-slate-500">
            Markets the community wants to see
          </p>
        </div>
        <Link
          href={ROUTES.marketsCommunity}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          Submit Market →
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Column 1 — Most Voted */}
        <ColumnCard
          title="🔥 Most Voted"
          footer={
            <Link
              href={ROUTES.marketsCommunity}
              className="mt-4 block text-xs text-slate-500 transition-colors hover:text-slate-300"
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

        {/* Column 2 — Just Submitted */}
        <ColumnCard
          title="🆕 Just Submitted"
          footer={
            <Link
              href={ROUTES.marketsCommunity}
              className="mt-4 block text-xs text-slate-500 transition-colors hover:text-slate-300"
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
              <NewestItem key={s.id} suggestion={s} isLast={i === newest.length - 1} />
            ))
          )}
        </ColumnCard>

        {/* Column 3 — Top Creators */}
        <ColumnCard
          title="🏆 Top Creators"
          footer={
            <Link
              href={ROUTES.LEADERBOARD}
              className="mt-4 block text-xs text-slate-500 transition-colors hover:text-slate-300"
            >
              View all →
            </Link>
          }
        >
          {creatorsQuery.isLoading && creators.length === 0 ? (
            <ColumnSkeleton />
          ) : creators.length === 0 ? (
            <EmptyColumn label="No creators yet" />
          ) : (
            creators.map((creator, index) => (
              <div
                key={creator.creatorAddress}
                className={cn(
                  "flex items-center gap-3",
                  index < creators.length - 1 && "mb-3 border-b border-white/5 pb-3",
                )}
              >
                <span className="w-6 shrink-0 text-lg font-black text-slate-600">
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
                    className="block truncate font-mono text-sm text-slate-300 hover:text-white"
                  >
                    {shortenAddress(creator.creatorAddress)}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {creator.marketCount} market{creator.marketCount === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-green-400">
                  {formatFeesBnb(creator.feesEarned)}
                </span>
              </div>
            ))
          )}
        </ColumnCard>
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-white">Have an idea for a market?</p>
          <p className="mt-1 text-sm text-slate-400">
            Submit it. If the community votes it up, it goes live.
          </p>
        </div>
        <Link
          href={ROUTES.marketsCommunity}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-6 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100"
        >
          Submit Market Idea
        </Link>
      </div>
    </section>
  );
}
