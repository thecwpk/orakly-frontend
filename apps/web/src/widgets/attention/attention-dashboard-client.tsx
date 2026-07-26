"use client";

import { formatCompactUsd } from "@orakly/utils";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Bot,
  Boxes,
  Circle,
  Coins,
  Droplets,
  Gamepad2,
  ImageIcon,
  Landmark,
  Link2,
  Radio,
  type LucideIcon,
} from "lucide-react";
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
  icon: LucideIcon;
};

/** Canonical narrative set — always rendered (zeros if no API row). */
const PREDEFINED: readonly PredefinedNarrative[] = [
  { name: "AI", slug: "ai", icon: Bot },
  { name: "Memes", slug: "memes", icon: Coins },
  { name: "Ethereum", slug: "ethereum", icon: Boxes },
  { name: "BNB", slug: "bnb", icon: Circle },
  { name: "Base", slug: "base", icon: Circle },
  { name: "Solana", slug: "solana", icon: Boxes },
  { name: "Gaming", slug: "gaming", icon: Gamepad2 },
  { name: "RWA", slug: "rwa", icon: Landmark },
  { name: "DeFi", slug: "defi", icon: Droplets },
  { name: "Layer1", slug: "layer1", icon: Link2 },
  { name: "Layer2", slug: "layer2", icon: Link2 },
  { name: "NFTs", slug: "nfts", icon: ImageIcon },
] as const;

type NarrativeCardModel = {
  id: string;
  name: string;
  slug: string;
  icon: LucideIcon;
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
    icon: predefined.icon,
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
    icon: predefined.icon,
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
          muted && "bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] text-[var(--foreground-muted)] ring-[var(--border)]",
          !muted &&
            momentum === "Growing" &&
            "bg-emerald-500/15 text-emerald-300 ring-emerald-400/25",
          !muted &&
            momentum === "Cooling" &&
            "bg-rose-500/15 text-rose-300 ring-rose-400/25",
          !muted &&
            momentum === "Stable" &&
            "bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] text-[var(--foreground-muted)] ring-[var(--border)]",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-[12px] font-semibold tabular-nums",
          muted && "text-[var(--foreground-muted)]",
          !muted && pct > 0 && "text-emerald-400",
          !muted && pct < 0 && "text-rose-400",
          !muted && pct === 0 && "text-[var(--foreground-muted)]",
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
  const NarrativeIcon = card.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border p-5 text-left transition duration-200",
        "cursor-pointer hover:scale-105 hover:shadow-lg",
        empty
          ? "border-[var(--border)] bg-[var(--background-secondary)] hover:shadow-black/40"
          : "border-[var(--border)] bg-[var(--background-secondary)] hover:shadow-blue-950/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={cn(
            "text-[18px] font-bold tracking-tight",
            empty ? "text-[var(--foreground-muted)]" : "text-[var(--foreground)]",
          )}
        >
          {card.name}
        </h3>
        <NarrativeIcon className="size-5 text-[var(--foreground-muted)]" aria-hidden />
      </div>

      <div className="mt-4">
        <p className="text-[11px] text-[var(--foreground-muted)]">Attention</p>
        <p
          className={cn(
            "text-[48px] font-bold leading-none tracking-tight",
            empty ? "text-[var(--foreground-muted)]" : tone.text,
          )}
        >
          {Math.round(card.attentionScore)}
        </p>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)]">
          <div
            className={cn("h-full rounded-full", empty ? "bg-[var(--foreground-muted)]" : tone.bar)}
            style={{ width: `${barPct}%` }}
          />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[11px] text-[var(--foreground-muted)]">Conviction</p>
        <p
          className={cn(
            "text-[24px] font-bold tabular-nums",
            empty ? "text-[var(--foreground-muted)]" : "text-[var(--foreground)]",
          )}
        >
          {Math.round(card.convictionScore)}
        </p>
      </div>

      <div
        className={cn(
          "mt-3 flex justify-between text-[12px]",
          empty ? "text-[var(--foreground-muted)]" : "text-[var(--foreground-muted)]",
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
        <div key={i} className="h-64 animate-pulse rounded-2xl bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]" />
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
        icon: Radio,
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
        <h1 className="text-[32px] font-bold tracking-tight text-[var(--foreground)]">Narratives</h1>
        <p className="mt-1 text-[15px] text-[var(--foreground-muted)]">
          Explore crypto attention across narrative categories.
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
          <h2 className="text-[20px] font-semibold text-[var(--foreground)]">Attention Heatmap</h2>
          <p className="mt-1 text-[13px] text-[var(--foreground-muted)]">
            Tile size = activity level. Color = momentum.
          </p>
        </div>
        {dashboardQuery.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]" />
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
