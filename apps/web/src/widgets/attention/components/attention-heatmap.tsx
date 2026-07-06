"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/shared/constants/routes";

export interface AttentionHeatmapNarrative {
  narrativeSlug: string;
  narrativeName: string;
  attentionScore: number;
  momentum: "Growing" | "Cooling" | "Stable";
  activeMarkets: number;
  volume24hUsd: number;
  uniqueTraders: number;
  convictionScore: number;
}

export interface AttentionHeatmapProps {
  narratives: AttentionHeatmapNarrative[];
  onNarrativeClick?: (slug: string) => void;
}

const compactUsd = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const MOMENTUM_TILE: Record<
  AttentionHeatmapNarrative["momentum"],
  { tile: string; icon: string; iconClass: string }
> = {
  Growing: {
    tile: "bg-green-100 border-green-300",
    icon: "↑",
    iconClass: "text-green-600",
  },
  Cooling: {
    tile: "bg-red-100 border-red-300",
    icon: "↓",
    iconClass: "text-red-600",
  },
  Stable: {
    tile: "bg-amber-50 border-amber-200",
    icon: "→",
    iconClass: "text-gray-500",
  },
};

function formatUsd(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "$0";
  return `$${compactUsd.format(value)}`;
}

function formatTooltip(narrative: AttentionHeatmapNarrative): string {
  return `Volume: ${formatUsd(narrative.volume24hUsd)} | Traders: ${narrative.uniqueTraders} | Conviction: ${Math.round(narrative.convictionScore)}`;
}

function tileColumnSpan(activeMarkets: number): number {
  return activeMarkets >= 10 ? 2 : 1;
}

export function AttentionHeatmap({ narratives, onNarrativeClick }: AttentionHeatmapProps) {
  const router = useRouter();

  const handleClick = (slug: string) => {
    if (onNarrativeClick) {
      onNarrativeClick(slug);
      return;
    }

    const params = new URLSearchParams({ narrative: slug });
    router.push(`${ROUTES.attention}?${params.toString()}`);
  };

  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}
    >
      {narratives.map((narrative) => {
        const momentum = MOMENTUM_TILE[narrative.momentum];
        const span = tileColumnSpan(narrative.activeMarkets);

        return (
          <div
            key={narrative.narrativeSlug}
            role="button"
            tabIndex={0}
            title={formatTooltip(narrative)}
            className={cn(
              "flex min-h-[100px] cursor-pointer flex-col justify-between rounded-xl border p-3 transition-shadow hover:shadow-md",
              momentum.tile,
            )}
            style={{ gridColumn: `span ${span}` }}
            onClick={() => handleClick(narrative.narrativeSlug)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleClick(narrative.narrativeSlug);
              }
            }}
          >
            <p className="truncate text-sm font-semibold text-gray-900">
              {narrative.narrativeName}
            </p>

            <div className="mt-2 flex items-end justify-between gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {Math.round(narrative.attentionScore)}
              </span>
              <span className={cn("text-lg leading-none", momentum.iconClass)} aria-hidden>
                {momentum.icon}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
