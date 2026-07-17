"use client";

import { formatCompactUsd } from "@orakly/utils";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { LeaderboardAvatar } from "@/features/leaderboard/components/leaderboard-avatar";
import { slugToDisplayName } from "@/lib/narrative-slug";
import { cn } from "@/lib/utils";
import { fetchAttentionDashboard } from "@/shared/api/fetchers/attention-dashboard";
import {
  fetchCreatorLeaderboard,
  fetchTraderLeaderboard,
} from "@/shared/api/fetchers/leaderboard";
import {
  fetchAttentionHistory,
  fetchNarrativeComments,
  fetchNarrativeMarkets,
  fetchNarrativeTimeline,
  postNarrativeComment,
} from "@/shared/api/fetchers/narrative-detail";
import { queryKeys } from "@/shared/api/query-keys";
import { ROUTES } from "@/shared/constants/routes";
import type { AttentionDashboardItem } from "@/shared/contracts/attention-dashboard";
import type { AttentionHistoryPeriod } from "@/shared/contracts/attention-history";
import type { LiveMarketCardDto } from "@/shared/contracts/live-markets";
import { AttentionScoreCard } from "@/widgets/attention/components/attention-score-card";
import { NarrativeGridCard } from "@/widgets/attention/components/narrative-grid-card";
import { LiveMarketCard } from "@/widgets/dapp-hub/sections/live-markets";
import "@/widgets/dapp-hub/hub-design-tokens.css";
import { NarrativeHistoryChart } from "@/widgets/narratives/narrative-history-chart";

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

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function toLiveCard(m: Awaited<ReturnType<typeof fetchNarrativeMarkets>>[number]): LiveMarketCardDto {
  return {
    ...m,
    participants: 0,
  };
}

function StatsBar({ narrative }: { narrative: AttentionDashboardItem }) {
  const items = [
    { label: "Attention", value: String(Math.round(narrative.attentionScore)) },
    { label: "Conviction", value: String(Math.round(narrative.convictionScore)) },
    { label: "Markets", value: String(narrative.activeMarkets) },
    { label: "Volume", value: formatCompactUsd(narrative.volume24hUsd) },
    { label: "Momentum", value: narrative.momentum },
    { label: "Open Interest", value: formatCompactUsd(narrative.openInterest) },
    { label: "Traders", value: String(narrative.uniqueTraders) },
  ];

  return (
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-white/[0.08] bg-zinc-950/40 px-3 py-2.5"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            {item.label}
          </p>
          <p className="mt-1 text-[14px] font-semibold tabular-nums text-zinc-100">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function NarrativeDiscussion({ slug }: { slug: string }) {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const key = ["narrative-comments", slug] as const;

  const commentsQ = useQuery({
    queryKey: key,
    queryFn: () => fetchNarrativeComments(slug),
    staleTime: 15_000,
  });

  const postMutation = useMutation({
    mutationFn: () => postNarrativeComment(slug, body),
    onSuccess: () => {
      setBody("");
      void qc.invalidateQueries({ queryKey: key });
      toast.success("Comment posted");
    },
    onError: () => toast.error("Unable to post. Connect your wallet and try again."),
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
          disabled={postMutation.isPending}
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

      <ul className="mt-5 space-y-4">
        {comments.length === 0 && !commentsQ.isLoading ? (
          <li className="py-6 text-center text-[13px] text-zinc-500">
            No comments yet. Start the discussion.
          </li>
        ) : null}
        {comments.map((c) => (
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
              <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-[10px]">
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
                  <span className="text-zinc-400">Anonymous</span>
                )}
                <span className="text-zinc-500">{timeAgo(c.createdAt)}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-[14px] text-zinc-300">{c.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function NarrativeDetailClient({
  slug,
  narrative,
}: {
  slug: string;
  narrative: AttentionDashboardItem;
}) {
  const router = useRouter();
  const displayName = narrative.narrativeName || slugToDisplayName(slug);

  const marketsQ = useQuery({
    queryKey: ["narrative-markets", slug],
    queryFn: () => fetchNarrativeMarkets(slug, 10),
    staleTime: 20_000,
  });

  const tradersQ = useQuery({
    queryKey: ["narrative-traders", slug],
    queryFn: () =>
      fetchTraderLeaderboard({ narrative: slug, limit: 5, take: 5, window: "all" }),
    staleTime: 30_000,
  });

  const creatorsQ = useQuery({
    queryKey: ["narrative-creators", slug],
    queryFn: () => fetchCreatorLeaderboard(5, slug),
    staleTime: 30_000,
  });

  const timelineQ = useQuery({
    queryKey: ["narrative-timeline", slug],
    queryFn: () => fetchNarrativeTimeline(slug, 20),
    staleTime: 20_000,
  });

  const relatedQ = useQuery({
    queryKey: queryKeys.hub.attentionDashboard(20),
    queryFn: () => fetchAttentionDashboard(20),
    staleTime: 60_000,
  });

  const markets = useMemo(
    () => (marketsQ.data ?? []).map(toLiveCard),
    [marketsQ.data],
  );

  const related = useMemo(() => {
    const items = relatedQ.data?.data ?? [];
    return [...items]
      .filter(
        (n) =>
          n.narrativeSlug.toLowerCase() !== slug.toLowerCase() &&
          n.narrativeName.toLowerCase() !== displayName.toLowerCase(),
      )
      .sort((a, b) => b.attentionScore - a.attentionScore)
      .slice(0, 4);
  }, [relatedQ.data, slug, displayName]);

  // Prefetch history so the chart hydrates smoothly (chart has its own query).
  useQuery({
    queryKey: queryKeys.hub.attentionHistory(slug, "7d" satisfies AttentionHistoryPeriod),
    queryFn: () => fetchAttentionHistory(slug, "7d"),
    staleTime: 60_000,
  });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-10 px-4 py-6 sm:px-6 lg:px-8">
      {/* Section 1 — Overview */}
      <section>
        <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-[13px] text-zinc-500">
          <Link href={ROUTES.attention} className="hover:text-blue-300">
            Narratives
          </Link>
          <span aria-hidden>→</span>
          <span className="text-zinc-300">{displayName}</span>
        </nav>

        <h1 className="text-[36px] font-bold tracking-tight text-zinc-50">{displayName}</h1>

        <div className="mt-6">
          <AttentionScoreCard
            fullWidth
            className="border-white/10 bg-zinc-950/60 text-zinc-100 shadow-none [&_h3]:text-zinc-50 [&_span]:!text-inherit"
            narrativeName={narrative.narrativeName}
            narrativeSlug={narrative.narrativeSlug}
            attentionScore={narrative.attentionScore}
            convictionScore={narrative.convictionScore}
            momentum={narrative.momentum}
            volume24hUsd={narrative.volume24hUsd}
            activeMarkets={narrative.activeMarkets}
            uniqueTraders={narrative.uniqueTraders}
            liquidity={narrative.liquidity}
            openInterest={narrative.openInterest}
          />
        </div>

        <StatsBar narrative={narrative} />
      </section>

      {/* Section 2 — History */}
      <section className="rounded-2xl border border-white/[0.08] p-5">
        <NarrativeHistoryChart slug={slug} />
      </section>

      {/* Section 3 — Active Markets */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-[18px] font-semibold text-zinc-100">Active Markets</h2>
          <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[12px] font-semibold text-zinc-400 ring-1 ring-white/10">
            {markets.length}
          </span>
        </div>
        {marketsQ.isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl bg-zinc-800/60" />
            ))}
          </div>
        ) : markets.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-[14px] text-zinc-500">
            No open markets in this narrative yet.
          </p>
        ) : (
          <div className="hub-root grid grid-cols-1 gap-4 md:grid-cols-2">
            {markets.map((m) => (
              <LiveMarketCard key={m.id} market={m} />
            ))}
          </div>
        )}
        <Link
          href={`${ROUTES.markets}?narrative=${encodeURIComponent(slug)}`}
          className="mt-4 inline-flex text-[13px] font-semibold text-blue-400 hover:underline"
        >
          View all {narrative.activeMarkets || markets.length} markets in this narrative →
        </Link>
      </section>

      {/* Section 4 — Top Traders */}
      <section className="rounded-2xl border border-white/[0.08] p-5">
        <h2 className="mb-4 text-[18px] font-semibold text-zinc-100">Top Traders</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.08] text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="px-2 py-2">Rank</th>
                <th className="px-2 py-2">Wallet</th>
                <th className="px-2 py-2">Volume</th>
                <th className="px-2 py-2">Win Rate</th>
                <th className="px-2 py-2">PnL</th>
              </tr>
            </thead>
            <tbody>
              {(tradersQ.data ?? []).length === 0 && !tradersQ.isLoading ? (
                <tr>
                  <td colSpan={5} className="px-2 py-8 text-center text-zinc-500">
                  No traders yet for this narrative.
                  </td>
                </tr>
              ) : null}
              {(tradersQ.data ?? []).map((row, i) => (
                <tr key={row.userId} className="border-b border-white/[0.05]">
                  <td className="px-2 py-2.5 font-bold text-zinc-500">{i + 1}</td>
                  <td className="px-2 py-2.5">
                    {row.walletAddress ? (
                      <Link
                        href={ROUTES.traderProfile(row.walletAddress)}
                        className="inline-flex items-center gap-2 font-mono text-zinc-200 hover:text-blue-300"
                      >
                        <LeaderboardAvatar
                          address={row.walletAddress}
                          className="h-6 w-6 rounded-full"
                        />
                        {shortenAddress(row.walletAddress)}
                      </Link>
                    ) : (
                      <span className="text-zinc-500">N/A</span>
                    )}
                  </td>
                  <td className="px-2 py-2.5 tabular-nums text-zinc-200">
                    {formatCompactUsd(Number(row.totalVolumeUsd))}
                  </td>
                  <td className="px-2 py-2.5 tabular-nums text-zinc-300">
                    {row.winRatePct.toFixed(1)}%
                  </td>
                  <td
                    className={cn(
                      "px-2 py-2.5 tabular-nums font-medium",
                      Number(row.pnlUsd) >= 0 ? "text-emerald-400" : "text-rose-400",
                    )}
                  >
                    {formatCompactUsd(Number(row.pnlUsd))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 5 — Top Creators */}
      <section className="rounded-2xl border border-white/[0.08] p-5">
        <h2 className="mb-4 text-[18px] font-semibold text-zinc-100">Top Creators</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.08] text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="px-2 py-2">Rank</th>
                <th className="px-2 py-2">Wallet</th>
                <th className="px-2 py-2">Markets Created</th>
                <th className="px-2 py-2">Volume Generated</th>
                <th className="px-2 py-2">Fees Earned</th>
              </tr>
            </thead>
            <tbody>
              {(creatorsQ.data ?? []).length === 0 && !creatorsQ.isLoading ? (
                <tr>
                  <td colSpan={5} className="px-2 py-8 text-center text-zinc-500">
                    No creators yet for this narrative.
                  </td>
                </tr>
              ) : null}
              {(creatorsQ.data ?? []).map((row, i) => (
                <tr key={row.creatorAddress} className="border-b border-white/[0.05]">
                  <td className="px-2 py-2.5 font-bold text-zinc-500">{i + 1}</td>
                  <td className="px-2 py-2.5">
                    <Link
                      href={ROUTES.traderProfile(row.creatorAddress)}
                      className="inline-flex items-center gap-2 font-mono text-zinc-200 hover:text-blue-300"
                    >
                      <LeaderboardAvatar
                        address={row.creatorAddress}
                        className="h-6 w-6 rounded-full"
                      />
                      {shortenAddress(row.creatorAddress)}
                    </Link>
                  </td>
                  <td className="px-2 py-2.5 tabular-nums text-zinc-300">
                    {row.marketCount}
                  </td>
                  <td className="px-2 py-2.5 tabular-nums text-zinc-200">
                    {formatCompactUsd(row.totalVolumeUsd)}
                  </td>
                  <td className="px-2 py-2.5 tabular-nums text-emerald-400">
                    {formatCompactUsd(row.feesEarned)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 6 — Timeline */}
      <section className="rounded-2xl border border-white/[0.08] p-5">
        <h2 className="mb-5 text-[18px] font-semibold text-zinc-100">Timeline</h2>
        {(timelineQ.data ?? []).length === 0 && !timelineQ.isLoading ? (
          <p className="text-[13px] text-zinc-500">No timeline events yet.</p>
        ) : (
          <ol className="relative space-y-0 border-l border-white/10 pl-6">
            {(timelineQ.data ?? []).map((event) => (
              <li key={event.id} className="relative pb-6 last:pb-0">
                <span className="absolute -left-[1.6rem] top-1.5 size-2.5 rounded-full bg-blue-500 ring-4 ring-zinc-950" />
                <p className="text-[11px] font-medium text-zinc-500">
                  {formatDate(event.at)}
                </p>
                <p className="mt-1 text-[14px] text-zinc-200">{event.description}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Section 7 — Discussion */}
      <NarrativeDiscussion slug={slug} />

      {/* Section 8 — Related */}
      <section>
        <h2 className="mb-4 text-[18px] font-semibold text-zinc-100">Related Narratives</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {related.map((n) => (
            <NarrativeGridCard
              key={n.id}
              className="min-w-[240px] max-w-[280px] shrink-0"
              card={{
                name: n.narrativeName,
                slug: n.narrativeSlug,
                attentionScore: n.attentionScore,
                convictionScore: n.convictionScore,
                activeMarkets: n.activeMarkets,
                volume24hUsd: n.volume24hUsd,
                momentum: n.momentum,
                momentumPct:
                  n.scorePrev24h > 0
                    ? ((n.attentionScore - n.scorePrev24h) / n.scorePrev24h) * 100
                    : 0,
              }}
              onClick={() =>
                router.push(`/narratives/${encodeURIComponent(n.narrativeSlug)}`)
              }
            />
          ))}
          {related.length === 0 && !relatedQ.isLoading ? (
            <p className="text-[13px] text-zinc-500">No related narratives yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
