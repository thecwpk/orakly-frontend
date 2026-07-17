"use client";

import Link from "next/link";
import { useAttentionDashboardQuery, useHomeStatsQuery } from "@/shared/api/hooks";
import { ROUTES } from "@/shared/constants/routes";
import { fmtCount, fmtUsdCompact } from "../lib/format-hub-metrics";
import { HubAttentionRisingPanel } from "./hub-attention-rising-panel";
import { HubMetricTile } from "./hub-metric-tile";

export function HubHeroAttentionTerminal() {
  const statsQ = useHomeStatsQuery();
  const attentionQ = useAttentionDashboardQuery();
  const stats = statsQ.data;

  return (
    <section className="hub-section hub-section--mobile-reorder-hero !pt-6 sm:!pt-8">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
        <div className="flex flex-col justify-center gap-5">
          <div>
            <p className="hub-eyebrow mb-3">
              <span className="size-1.5 rounded-full bg-[var(--hub-primary-bright)]" aria-hidden />
              Live prediction markets
            </p>
            <h1 className="hub-hero-title">Trade what the market is watching</h1>
            <p className="mt-3 max-w-lg text-base leading-relaxed text-[var(--hub-muted)]">
              Discover trending events, follow narrative momentum, and place trades on outcomes
              before consensus forms.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={ROUTES.markets} className="hub-btn-primary px-5 py-2.5">
                Browse Markets
              </Link>
              <Link href={ROUTES.marketCreate} className="hub-btn-secondary px-5 py-2.5">
                Suggest a Market
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-[var(--hub-card-gap)]">
            <HubMetricTile
              label="Narratives"
              value={stats ? fmtCount(stats.activeNarratives) : "N/A"}
              loading={statsQ.isLoading}
            />
            <HubMetricTile
              label="Live markets"
              value={stats ? fmtCount(stats.liveMarkets) : "N/A"}
              loading={statsQ.isLoading}
            />
            <HubMetricTile
              label="24h volume"
              value={stats ? fmtUsdCompact(stats.volume24hUsd) : "N/A"}
              loading={statsQ.isLoading}
            />
            <HubMetricTile
              label="Updates today"
              value={stats ? fmtCount(stats.attentionUpdates24h) : "N/A"}
              loading={statsQ.isLoading}
            />
          </div>
        </div>

        <HubAttentionRisingPanel
          rows={attentionQ.data ?? []}
          loading={attentionQ.isLoading}
          isFetching={attentionQ.isFetching}
        />
      </div>
    </section>
  );
}
