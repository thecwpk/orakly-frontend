"use client";

import { formatCompactUsd } from "@orakly/utils";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { fetchAttentionDashboard } from "@/shared/api/fetchers/attention-dashboard";
import { queryKeys } from "@/shared/api/query-keys";
import type {
  AttentionDashboardItem,
  AttentionMomentum,
} from "@/shared/contracts/attention-dashboard";
import { AttentionHeatmap } from "@/widgets/attention/components/attention-heatmap";

const DASHBOARD_LIMIT = 20;
const REFETCH_MS = 30_000;

type PredefinedNarrative = {
  name: string;
  slug: string;
  emoji: string;
};

/** Canonical narrative set — always rendered (zeros if no API row). */
const PREDEFINED: readonly PredefinedNarrative[] = [
  { name: "AI", slug: "ai", emoji: "🤖" },
  { name: "Memes", slug: "memes", emoji: "🐸" },
  { name: "Ethereum", slug: "ethereum", emoji: "⟠" },
  { name: "BNB", slug: "bnb", emoji: "🟡" },
  { name: "Base", slug: "base", emoji: "🔵" },
  { name: "Solana", slug: "solana", emoji: "◎" },
  { name: "Gaming", slug: "gaming", emoji: "🎮" },
  { name: "RWA", slug: "rwa", emoji: "🏦" },
  { name: "DeFi", slug: "defi", emoji: "💧" },
  { name: "Layer1", slug: "layer1", emoji: "⛓️" },
  { name: "Layer2", slug: "layer2", emoji: "🔗" },
  { name: "NFTs", slug: "nfts", emoji: "🖼️" },
] as const;

type NarrativeCardModel = {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  attentionScore: number;
  convictionScore: number;
  activeMarkets: number;
  volume24hUsd: number;
  uniqueTraders: number;
  momentum: AttentionMomentum;
  momentumPct: number;
  empty: boolean;
};

function scoreTone(score: number): {
  text: string;
  bar: string;
} {
  if (score < 34) return { text: "text-rose-400", bar: "bg-rose-500" };
  if (score < 67) return { text: "text-amber-400", bar: "bg-amber-500" };
  return { text: "text-emerald-400", bar: "bg-emerald-500" };
}

function momentumPct(score: number, prev: number): number {
  if (!Number.isFinite(score)) return 0;
  if (!Number.isFinite(prev) || prev <= 0) {
    return score > 0 ? 100 : 0;
  }
  return ((score - prev) / prev) * 100;
}

function formatMomentumPct(pct: number): string {
  if (!Number.isFinite(pct) || Math.abs(pct) < 0.05) return "0%";
  const rounded = Math.round(pct);
  return rounded > 0 ? `+${rounded}%` : `${rounded}%`;
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function findApiMatch(
  predefined: PredefinedNarrative,
  items: AttentionDashboardItem[],
): AttentionDashboardItem | undefined {
  const nameKey = normalizeKey(predefined.name);
  const slugKey = normalizeKey(predefined.slug);
  return items.find((item) => {
    const n = normalizeKey(item.narrativeName);
    const s = normalizeKey(item.narrativeSlug);
    return n === nameKey || s === slugKey || s === nameKey || n === slugKey;
  });
}

function emptyCard(predefined: PredefinedNarrative): NarrativeCardModel {
  return {
    id: `empty-${predefined.slug}`,
    name: predefined.name,
    slug: predefined.slug,
    emoji: predefined.emoji,
    attentionScore: 0,
    convictionScore: 0,
    activeMarkets: 0,
    volume24hUsd: 0,
    uniqueTraders: 0,
    momentum: "Stable",
    momentumPct: 0,
    empty: true,
  };
}

function fromApi(
  predefined: PredefinedNarrative,
  item: AttentionDashboardItem,
): NarrativeCardModel {
  return {
    id: item.id,
    name: predefined.name,
    slug: item.narrativeSlug || predefined.slug,
    emoji: predefined.emoji,
    attentionScore: item.attentionScore ?? 0,
    convictionScore: item.convictionScore ?? 0,
    activeMarkets: item.activeMarkets ?? 0,
    volume24hUsd: item.volume24hUsd ?? 0,
    uniqueTraders: item.uniqueTraders ?? 0,
    momentum: item.momentum ?? "Stable",
    momentumPct: momentumPct(item.attentionScore, item.scorePrev24h),
    empty: false,
  };
}

function MomentumBadge({
  momentum,
  pct,
  muted,
}: {
  momentum: AttentionMomentum;
  pct: number;
  muted?: boolean;
}) {
  const label =
    momentum === "Growing"
      ? "Growing ↑"
      : momentum === "Cooling"
        ? "Cooling ↓"
        : "Stable →";

  return (
    <div className="mt-4 flex items-center justify-between gap-2">
      <span
        className={cn(
          "rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1",
          muted && "bg-zinc-800/60 text-zinc-500 ring-white/5",
          !muted &&
            momentum === "Growing" &&
            "bg-emerald-500/15 text-emerald-300 ring-emerald-400/25",
          !muted &&
            momentum === "Cooling" &&
            "bg-rose-500/15 text-rose-300 ring-rose-400/25",
          !muted &&
            momentum === "Stable" &&
            "bg-zinc-500/15 text-zinc-400 ring-white/10",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-[12px] font-semibold tabular-nums",
          muted && "text-zinc-600",
          !muted && pct > 0 && "text-emerald-400",
          !muted && pct < 0 && "text-rose-400",
          !muted && pct === 0 && "text-zinc-500",
        )}
      >
        {formatMomentumPct(pct)}
      </span>
    </div>
  );
}

function NarrativeCard({
  card,
  onClick,
}: {
  card: NarrativeCardModel;
  onClick: () => void;
}) {
  const tone = scoreTone(card.attentionScore);
  const empty = card.empty;
  const barPct = Math.max(0, Math.min(100, card.attentionScore));

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border p-5 text-left transition duration-200",
        "cursor-pointer hover:scale-105 hover:shadow-lg",
        empty
          ? "border-white/[0.06] bg-zinc-950/40 hover:shadow-black/40"
          : "border-white/[0.08] bg-zinc-950/50 hover:shadow-blue-950/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={cn(
            "text-[18px] font-bold tracking-tight",
            empty ? "text-zinc-500" : "text-zinc-50",
          )}
        >
          {card.name}
        </h3>
        <span className="text-[20px] leading-none" aria-hidden>
          {card.emoji}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-[11px] text-zinc-500">Attention</p>
        <p
          className={cn(
            "text-[48px] font-bold leading-none tracking-tight",
            empty ? "text-zinc-600" : tone.text,
          )}
        >
          {Math.round(card.attentionScore)}
        </p>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={cn("h-full rounded-full", empty ? "bg-zinc-600" : tone.bar)}
            style={{ width: `${barPct}%` }}
          />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[11px] text-zinc-500">Conviction</p>
        <p
          className={cn(
            "text-[24px] font-bold tabular-nums",
            empty ? "text-zinc-600" : "text-zinc-100",
          )}
        >
          {Math.round(card.convictionScore)}
        </p>
      </div>

      <div
        className={cn(
          "mt-3 flex justify-between text-[12px]",
          empty ? "text-zinc-600" : "text-zinc-400",
        )}
      >
        <span>Markets: {card.activeMarkets}</span>
        <span>Volume: {formatCompactUsd(card.volume24hUsd)}</span>
      </div>

      <MomentumBadge momentum={card.momentum} pct={card.momentumPct} muted={empty} />
    </button>
  );
}

function CardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="h-64 animate-pulse rounded-2xl bg-zinc-800/60" />
      ))}
    </div>
  );
}

export function AttentionDashboardClient() {
  const router = useRouter();

  const dashboardQuery = useQuery({
    queryKey: queryKeys.hub.attentionDashboard(DASHBOARD_LIMIT),
    queryFn: () => fetchAttentionDashboard(DASHBOARD_LIMIT),
    refetchInterval: REFETCH_MS,
    staleTime: 15_000,
  });

  const apiItems = dashboardQuery.data?.data ?? [];

  const cards = useMemo(() => {
    const usedIds = new Set<string>();
    const predefinedCards: NarrativeCardModel[] = PREDEFINED.map((pre) => {
      const match = findApiMatch(pre, apiItems);
      if (match) {
        usedIds.add(match.id);
        return fromApi(pre, match);
      }
      return emptyCard(pre);
    });

    const extras: NarrativeCardModel[] = apiItems
      .filter((item) => !usedIds.has(item.id))
      .map((item) => ({
        id: item.id,
        name: item.narrativeName,
        slug: item.narrativeSlug,
        emoji: "📡",
        attentionScore: item.attentionScore ?? 0,
        convictionScore: item.convictionScore ?? 0,
        activeMarkets: item.activeMarkets ?? 0,
        volume24hUsd: item.volume24hUsd ?? 0,
        uniqueTraders: item.uniqueTraders ?? 0,
        momentum: item.momentum ?? "Stable",
        momentumPct: momentumPct(item.attentionScore, item.scorePrev24h),
        empty: false,
      }));

    return [...predefinedCards, ...extras];
  }, [apiItems]);

  const heatmapNarratives = useMemo(
    () =>
      cards.map((c) => ({
        narrativeSlug: c.slug,
        narrativeName: c.name,
        attentionScore: c.attentionScore,
        momentum: c.momentum,
        activeMarkets: c.activeMarkets,
        volume24hUsd: c.volume24hUsd,
        uniqueTraders: c.uniqueTraders,
        convictionScore: c.convictionScore,
      })),
    [cards],
  );

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-[32px] font-bold tracking-tight text-zinc-50">Narratives</h1>
        <p className="mt-1 text-[15px] text-zinc-400">
          Explore crypto attention by narrative category
        </p>
      </header>

      {dashboardQuery.isError ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-6 text-sm text-rose-200">
          {dashboardQuery.error?.message ?? "Failed to load narratives."}
        </div>
      ) : null}

      <section aria-label="Narrative grid">
        {dashboardQuery.isLoading && cards.every((c) => c.empty) ? (
          <CardsSkeleton />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {cards.map((card) => (
              <NarrativeCard
                key={card.id}
                card={card}
                onClick={() => router.push(`/narratives/${encodeURIComponent(card.slug)}`)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-[20px] font-semibold text-zinc-100">Attention Heatmap</h2>
          <p className="mt-1 text-[13px] text-zinc-400">
            Tile size = activity level. Color = momentum.
          </p>
        </div>
        {dashboardQuery.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-800/60" />
            ))}
          </div>
        ) : (
          <AttentionHeatmap
            narratives={heatmapNarratives}
            onNarrativeClick={(slug) =>
              router.push(`/narratives/${encodeURIComponent(slug)}`)
            }
          />
        )}
      </section>
    </div>
  );
}
