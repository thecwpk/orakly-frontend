"use client";

import { SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ROUTES } from "@/shared/constants/routes";
import { resolveHubFeedTitle } from "../lib/hub-feed-title";

/** Section title row above the grid (Polymarket category page header). */
export function HubFeedSectionHeader({ marketCount }: { marketCount?: number }) {
  const searchParams = useSearchParams();
  const title = resolveHubFeedTitle({
    cat: searchParams?.get("cat"),
    narrative: searchParams?.get("narrative"),
    breaking: searchParams?.get("breaking") === "1",
    sort: searchParams?.get("sort"),
  });

  return (
    <div className="hub-feed-section-header">
      <div className="min-w-0">
        <h1 className="hub-feed-section-title">{title}</h1>
        {marketCount != null && marketCount > 0 ? (
          <p className="hub-feed-section-meta">{marketCount} markets</p>
        ) : null}
      </div>
      <Link
        href={ROUTES.markets}
        className="hub-feed-filter-btn"
        aria-label="Filter markets"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}
