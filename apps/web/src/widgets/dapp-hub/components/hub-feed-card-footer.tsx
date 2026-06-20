"use client";

import { Bookmark, Gift, RotateCcw } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/shared/constants/routes";
import { fmtUsdCompact } from "../lib/format-hub-metrics";

type HubFeedCardFooterProps = {
  volumeUsd: number;
  marketSlug?: string;
  showLive?: boolean;
  category?: string | null;
};

/** Volume + utility icons row (Polymarket card footer). */
export function HubFeedCardFooter({
  volumeUsd,
  marketSlug,
  showLive,
  category,
}: HubFeedCardFooterProps) {
  return (
    <div className="hub-feed-card-footer">
      <div className="hub-feed-card-footer-left">
        {showLive ? (
          <span className="hub-feed-live-badge">
            <span className="hub-feed-live-dot" aria-hidden />
            LIVE
          </span>
        ) : null}
        {category ? <span className="hub-feed-footer-category">{category}</span> : null}
        <span className="hub-feed-footer-vol">{fmtUsdCompact(volumeUsd)} Vol.</span>
      </div>
      <div className="hub-feed-card-footer-actions">
        <Link
          href={marketSlug ? ROUTES.market(marketSlug) : ROUTES.markets}
          className="hub-feed-footer-icon-btn"
          aria-label="View market activity"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Link>
        <button type="button" className="hub-feed-footer-icon-btn" aria-label="Rewards" disabled>
          <Gift className="h-3.5 w-3.5" />
        </button>
        <Link
          href={ROUTES.watchlist}
          className="hub-feed-footer-icon-btn"
          aria-label="Save to watchlist"
        >
          <Bookmark className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
