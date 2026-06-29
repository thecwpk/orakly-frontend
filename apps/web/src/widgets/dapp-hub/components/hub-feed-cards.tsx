"use client";

import Link from "next/link";
import type { HubMarketEnriched } from "@/shared/contracts/hub-home";
import { ROUTES } from "@/shared/constants/routes";
import { fmtCents, fmtUsdCompact } from "../lib/format-hub-metrics";
import {
  isUpDownMarket,
  marketIsLive,
  outcomeRowLabel,
  quickBetHints,
} from "../lib/hub-feed-grouping";
import { resolveHubMarketVisual } from "../lib/hub-market-visual";
import { HubFeedCardFooter } from "./hub-feed-card-footer";
import { HubProbabilityArc } from "./hub-probability-arc";

type HubFeedCardBinaryProps = {
  market: HubMarketEnriched;
  onTrade: (side: "YES" | "NO") => void;
};

/** Polymarket BTC Up/Down style — arc gauge + stacked bet hints + large buttons. */
export function HubFeedCardBinary({ market, onTrade }: HubFeedCardBinaryProps) {
  const visual = resolveHubMarketVisual(market.category, market.title);
  const Icon = visual.Icon;
  const upDown = isUpDownMarket(market.title);
  const yesLabel = upDown ? "Up" : "Yes";
  const noLabel = upDown ? "Down" : "No";
  const hints = quickBetHints(market.probability);
  const yesCents = fmtCents(market.probability);
  const noCents = fmtCents(1 - market.probability);
  const live = marketIsLive(market);

  return (
    <article className="hub-feed-card hub-feed-card--binary">
      <div className="hub-feed-card-body">
        <div className="hub-feed-card-header-row">
          <Link href={ROUTES.market(market.slug)} className="hub-feed-card-header-link">
            <span className="hub-feed-card-icon-sm" style={{ backgroundColor: visual.bg }}>
              <Icon className="h-4 w-4" style={{ color: visual.iconColor }} />
            </span>
            <span className="hub-feed-card-title-inline">{market.title}</span>
          </Link>
          <HubProbabilityArc probability={market.probability} label={yesLabel} />
        </div>

        <div className="hub-feed-binary-stage">
          <div className="hub-feed-binary-side hub-feed-binary-side--yes">
            <div className="hub-feed-binary-trail">
              {hints.yesTrail.map((amt) => (
                <span key={`y-${amt}`} className="hub-feed-binary-hint hub-feed-binary-hint--yes">
                  + ${amt}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onTrade("YES")}
              className="hub-feed-binary-btn hub-feed-binary-btn--yes"
            >
              <span className="hub-feed-binary-btn-main">
                {upDown ? `+ $${hints.yes} ${yesLabel}` : `${yesLabel} ${yesCents}`}
              </span>
            </button>
          </div>
          <div className="hub-feed-binary-side hub-feed-binary-side--no">
            <div className="hub-feed-binary-trail">
              {hints.noTrail.map((amt) => (
                <span key={`n-${amt}`} className="hub-feed-binary-hint hub-feed-binary-hint--no">
                  + ${amt}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onTrade("NO")}
              className="hub-feed-binary-btn hub-feed-binary-btn--no"
            >
              <span className="hub-feed-binary-btn-main">
                {upDown ? `${noLabel} + $${hints.no}` : `${noLabel} ${noCents}`}
              </span>
            </button>
          </div>
        </div>

        <HubFeedCardFooter
          volumeUsd={market.volumeUsd}
          marketSlug={market.slug}
          showLive={live}
          category={market.category}
        />
        {!live ? (
          <p className="hub-feed-card-vol-sub">{fmtUsdCompact(market.volume24hUsd)} 24h</p>
        ) : null}
      </div>
    </article>
  );
}

type HubFeedCardMultiProps = {
  eventTitle: string;
  category: string | null;
  markets: HubMarketEnriched[];
  totalVolumeUsd: number;
  onTrade: (market: HubMarketEnriched) => void;
};

/** Polymarket multi-outcome card — rows with % + compact Yes/No. */
export function HubFeedCardMulti({
  eventTitle,
  category,
  markets,
  totalVolumeUsd,
  onTrade,
}: HubFeedCardMultiProps) {
  const visual = resolveHubMarketVisual(category, eventTitle);
  const Icon = visual.Icon;
  const shown = markets.slice(0, 3);
  const primary = markets[0];

  return (
    <article className="hub-feed-card hub-feed-card--multi">
      <div className="hub-feed-card-body">
        <div className="hub-feed-card-header-row hub-feed-card-header-row--multi">
          <div className="hub-feed-card-header-link">
            <span className="hub-feed-card-icon-sm" style={{ backgroundColor: visual.bg }}>
              <Icon className="h-4 w-4" style={{ color: visual.iconColor }} />
            </span>
            <span className="hub-feed-card-title-inline">{eventTitle}</span>
          </div>
        </div>

        <ul className="hub-feed-outcome-rows">
          {shown.map((m) => {
            const pct = Math.round(m.probability * 100);
            return (
              <li key={m.id} className="hub-feed-outcome-row">
                <Link href={ROUTES.market(m.slug)} className="hub-feed-outcome-label-link">
                  {outcomeRowLabel(m.title)}
                </Link>
                <span className="hub-feed-outcome-pct">{pct}%</span>
                <div className="hub-feed-outcome-actions">
                  <button
                    type="button"
                    onClick={() => onTrade(m)}
                    className="hub-feed-outcome-chip hub-feed-outcome-chip--yes"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => onTrade(m)}
                    className="hub-feed-outcome-chip hub-feed-outcome-chip--no"
                  >
                    No
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        {markets.length > 3 ? (
          <Link href={ROUTES.markets} className="hub-feed-more-outcomes">
            +{markets.length - 3} more outcomes
          </Link>
        ) : null}

        <HubFeedCardFooter
          volumeUsd={totalVolumeUsd}
          marketSlug={primary?.slug}
          category={category}
        />
      </div>
    </article>
  );
}
