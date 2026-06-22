"use client";

import { Flame, TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HubMarketEnriched } from "@/shared/contracts/hub-home";
import { fmtMomentum, fmtUsdCompact } from "../lib/format-hub-metrics";
import { HubMiniSparkline } from "./hub-mini-sparkline";

type HubHeroTrendsRailProps = {
  markets: HubMarketEnriched[];
  activeId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
  liveSet: ReadonlySet<string>;
};

function TrendRow({
  market,
  active,
  live,
  onSelect,
}: {
  market: HubMarketEnriched;
  active: boolean;
  live: boolean;
  onSelect: () => void;
}) {
  const yes = Math.round((market.probability ?? 0.5) * 100);
  const momentum = market.momentumPct;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onSelect}
      className={cn(
        "hub-hero-trend-row",
        active && "hub-hero-trend-row--active",
      )}
    >
      <div className="hub-hero-trend-row-top">
        <span className="hub-hero-trend-row-icon" aria-hidden>
          {live ? <Zap className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
        </span>
        <div className="min-w-0 flex-1 text-left">
          <p className="hub-hero-trend-row-cat">{market.category}</p>
          <p className="hub-hero-trend-row-title">{market.title}</p>
        </div>
        <HubMiniSparkline probability={market.probability ?? 0.5} />
      </div>
      <div className="hub-hero-trend-row-stats">
        <span className="hub-hero-trend-row-yes">{yes}%</span>
        {momentum != null && Math.abs(momentum) > 0.5 ? (
          <span
            className={cn(
              "hub-hero-trend-row-mom",
              momentum > 0 ? "hub-hero-trend-row-mom--up" : "hub-hero-trend-row-mom--down",
            )}
          >
            {fmtMomentum(momentum)}
          </span>
        ) : null}
        <span className="hub-hero-trend-row-vol">{fmtUsdCompact(market.volume24hUsd)} 24h</span>
        {live ? <span className="hub-hero-trend-live">LIVE</span> : null}
      </div>
    </button>
  );
}

/** Left hero rail — trending & hot topics with mini charts (Polymarket-style). */
export function HubHeroTrendsRail({
  markets,
  activeId,
  onSelect,
  loading,
  liveSet,
}: HubHeroTrendsRailProps) {
  return (
    <div className="hub-hero-trends-rail">
      <div className="hub-hero-trends-rail-head">
        <span className="hub-hero-trends-rail-icon" aria-hidden>
          <Flame className="h-4 w-4" />
        </span>
        <div>
          <h2 className="hub-hero-trends-rail-title">Trending & hot</h2>
          <p className="hub-hero-trends-rail-sub">Top moves · latest signals</p>
        </div>
      </div>

      <div
        className="hub-hero-trends-rail-list"
        role="tablist"
        aria-label="Trending markets"
      >
        {loading && !markets.length
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="hub-skeleton hub-hero-trend-skeleton" />
            ))
          : null}
        {!loading && !markets.length ? (
          <p className="hub-hero-trends-empty">Trending markets will appear here soon.</p>
        ) : null}
        {markets.map((m) => (
          <TrendRow
            key={m.id}
            market={m}
            active={m.id === activeId}
            live={liveSet.has(m.id)}
            onSelect={() => onSelect(m.id)}
          />
        ))}
      </div>
    </div>
  );
}
