"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import type { CommunitySuggestion } from "@/shared/contracts/community-suggestion";
import { voteCommunitySuggestion } from "@/shared/api/fetchers/community-suggestions";
import { ROUTES } from "@/shared/constants/routes";
import { timeAgo } from "@/widgets/profile/lib/format";
import { cn } from "@/lib/utils";

function shortenAddress(address: string): string {
  const normalized = address.trim();
  if (normalized.length < 10) return normalized;
  return `${normalized.slice(0, 6)}...${normalized.slice(-4)}`;
}

function formatCategory(category: string): string {
  if (!category) return "General";
  return category
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const isApproved = normalized === "approved";
  const isRejected = normalized === "rejected";

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        isApproved && "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25",
        isRejected && "bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/25",
        !isApproved && !isRejected && "bg-zinc-500/15 text-[var(--foreground)] ring-1 ring-[var(--border)]",
      )}
    >
      {isApproved ? "Approved" : isRejected ? "Rejected" : "Pending"}
    </span>
  );
}

type CommunitySuggestionCardProps = {
  suggestion: CommunitySuggestion;
  walletAddress: string | null;
  queryKey: readonly unknown[];
};

export function CommunitySuggestionCard({
  suggestion,
  walletAddress,
  queryKey,
}: CommunitySuggestionCardProps) {
  const qc = useQueryClient();
  const { openConnectModal } = useConnectModal();
  const normalizedWallet = walletAddress?.toLowerCase() ?? null;
  const hasVoted =
    normalizedWallet != null &&
    suggestion.voterAddresses.some((addr) => addr.toLowerCase() === normalizedWallet);
  const isRejected = suggestion.status.toLowerCase() === "rejected";

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
      void qc.invalidateQueries({ queryKey });
    },
  });

  const creator = suggestion.creatorAddress?.trim() || null;
  const narrative = suggestion.narrative?.trim() || null;

  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <p className="text-[16px] font-semibold leading-snug text-[var(--foreground)]">
        {suggestion.question}
      </p>

      {suggestion.description?.trim() ? (
        <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-[var(--foreground-muted)]">
          {suggestion.description}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-[var(--foreground-muted)]">
        <span className="rounded-full bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] px-2.5 py-0.5 font-medium text-[var(--foreground)] ring-1 ring-[var(--border)]">
          {formatCategory(suggestion.category)}
        </span>
        {narrative ? (
          <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 font-medium text-blue-200 ring-1 ring-blue-400/20">
            {narrative}
          </span>
        ) : null}
        {creator ? (
          <Link
            href={ROUTES.traderProfile(creator)}
            className="font-mono tabular-nums text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
            onClick={(e) => e.stopPropagation()}
          >
            by {shortenAddress(creator)}
          </Link>
        ) : (
          <span className="font-mono tabular-nums">by Anonymous</span>
        )}
        <span aria-hidden>·</span>
        <span className="tabular-nums">{timeAgo(suggestion.createdAt)} ago</span>
      </div>

      {suggestion.resolutionSource?.trim() ? (
        <p className="mt-2 text-[12px] text-[var(--foreground-muted)]">
          Resolves via: {suggestion.resolutionSource}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold tabular-nums text-[var(--foreground)]">
            {suggestion.voteCount}
          </span>
          <button
            type="button"
            disabled={voteMutation.isPending}
            onClick={() => {
              if (!normalizedWallet) {
                openConnectModal?.();
                toast.message("Connect your wallet to vote.");
                return;
              }
              voteMutation.mutate();
            }}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-semibold transition ring-1",
              hasVoted
                ? "bg-blue-500/20 text-blue-100 ring-blue-400/30"
                : "bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] text-[var(--foreground)] ring-[var(--border)] hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]",
            )}
          >
            {hasVoted ? "Voted" : "Vote ↑"}
          </button>
        </div>

        <StatusBadge status={suggestion.status} />
      </div>

      {isRejected && suggestion.rejectionReason?.trim() ? (
        <p className="mt-3 text-[13px] italic text-rose-400">{suggestion.rejectionReason}</p>
      ) : null}
    </article>
  );
}
