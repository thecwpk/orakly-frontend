"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { LeaderboardAvatar } from "@/features/leaderboard/components/leaderboard-avatar";
import {
  fetchMarketComments,
  postMarketComment,
} from "@/shared/api/fetchers/market-comments";
import { queryKeys } from "@/shared/api/query-keys";
import { ROUTES } from "@/shared/constants/routes";
import Link from "next/link";

function shortenAddress(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function MarketDiscussion({ marketId }: { marketId: string }) {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const qc = useQueryClient();
  const [body, setBody] = useState("");

  const commentsKey = [...queryKeys.markets.detail(marketId), "comments"] as const;

  const commentsQ = useQuery({
    queryKey: commentsKey,
    queryFn: () => fetchMarketComments(marketId),
    staleTime: 15_000,
  });

  const postMutation = useMutation({
    mutationFn: () => postMarketComment(marketId, body),
    onSuccess: () => {
      setBody("");
      void qc.invalidateQueries({ queryKey: commentsKey });
      toast.success("Comment posted");
    },
    onError: () => {
      toast.error("Unable to post. Connect your wallet and try again.");
    },
  });

  const comments = commentsQ.data ?? [];

  return (
    <section className="rounded-2xl border border-white/[0.08] p-5">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-[18px] font-semibold text-zinc-100">Discussion</h2>
        <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[12px] font-semibold text-zinc-400 ring-1 ring-white/10">
          {comments.length}
        </span>
      </div>

      <div className="mb-5">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder={
            isConnected ? "Share your take…" : "Connect wallet to join the discussion"
          }
          className="w-full resize-y rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2.5 text-[14px] text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500/50"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            disabled={postMutation.isPending || (!isConnected && !openConnectModal)}
            onClick={() => {
              if (!isConnected) {
                openConnectModal?.();
                return;
              }
              if (!body.trim()) {
                toast.message("Write something first");
                return;
              }
              postMutation.mutate();
            }}
            className="rounded-xl bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {!isConnected ? "Connect Wallet" : postMutation.isPending ? "Posting…" : "Post"}
          </button>
        </div>
      </div>

      <ul className="space-y-4">
        {commentsQ.isLoading && comments.length === 0
          ? Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="h-16 animate-pulse rounded-xl bg-zinc-800/60" />
            ))
          : null}
        {!commentsQ.isLoading && comments.length === 0 ? (
          <li className="py-8 text-center text-[13px] text-zinc-500">
            No comments yet. Start the discussion.
          </li>
        ) : null}
        {comments.map((c) => {
          const wallet = c.walletAddress || "anonymous";
          return (
            <li
              key={c.id}
              className="flex gap-3 border-b border-white/[0.05] pb-4 last:border-0"
            >
              {c.walletAddress ? (
                <LeaderboardAvatar
                  address={c.walletAddress}
                  className="mt-0.5 h-8 w-8 rounded-full"
                />
              ) : (
                <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-[10px] text-zinc-300">
                  ?
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[12px]">
                  {c.walletAddress ? (
                    <Link
                      href={ROUTES.traderProfile(c.walletAddress)}
                      className="font-mono font-medium text-zinc-200 hover:text-blue-300"
                    >
                      {shortenAddress(c.walletAddress)}
                    </Link>
                  ) : (
                    <span className="font-medium text-zinc-400">{wallet}</span>
                  )}
                  <span className="text-zinc-500">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-[14px] text-zinc-300">{c.body}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
