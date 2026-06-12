"use client";

import { useAttentionDashboardQuery, useHomeStatsQuery } from "@/shared/api/hooks";
import { fmtCount, fmtUsdCompact } from "../lib/format-hub-metrics";
import { HubAttentionRisingPanel } from "./hub-attention-rising-panel";
import { HubMetricTile } from "./hub-metric-tile";

export function HubHeroAttentionTerminal() {
  const statsQ = useHomeStatsQuery();
  const attentionQ = useAttentionDashboardQuery();

  const stats = statsQ.data;

  return (
    <section className="hub-section hub-section--mobile-reorder-hero !pt-8">
      <div className="grid min-h-[420px] grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-[var(--hub-card-gap)]">
        <div className="flex flex-col justify-center gap-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--hub-fg)] sm:text-4xl">
              Crypto Attention Market
            </h1>
            <p className="mt-2 text-base text-[var(--hub-muted)]">
              Trade narratives before the market reacts.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-[var(--hub-card-gap)]">
            <HubMetricTile
              label="Active Narratives"
              value={stats ? fmtCount(stats.activeNarratives) : "—"}
              loading={statsQ.isLoading}
            />
            <HubMetricTile
              label="Live Markets"
              value={stats ? fmtCount(stats.liveMarkets) : "—"}
              loading={statsQ.isLoading}
            />
            <HubMetricTile
              label="24h Volume"
              value={stats ? fmtUsdCompact(stats.volume24hUsd) : "—"}
              loading={statsQ.isLoading}
            />
            <HubMetricTile
              label="Attention Updates"
              value={stats ? fmtCount(stats.attentionUpdates24h) : "—"}
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
