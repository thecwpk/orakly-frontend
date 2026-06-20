"use client";

import { Bookmark, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/shared/constants/routes";
import { AppSearch } from "@/widgets/app-shell/components/app-search";

/** Search + watchlist + filters below category tabs (Polymarket layout). */
export function HubFeedSearchRow() {
  return (
    <div className="hub-feed-search-row">
      <AppSearch variant="hub-light" className="hub-feed-search-input" />
      <Link
        href={ROUTES.watchlist}
        className="hub-feed-filter-btn"
        aria-label="Watchlist"
      >
        <Bookmark className="h-4 w-4" aria-hidden />
      </Link>
      <Link
        href={ROUTES.markets}
        className="hub-feed-filter-btn"
        aria-label="Open markets directory with filters"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}
