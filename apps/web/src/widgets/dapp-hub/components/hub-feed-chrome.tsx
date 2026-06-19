"use client";

import { HubCategoryChipBar } from "./hub-category-chip-bar";
import { HubFeedSearchRow } from "./hub-feed-search-row";
import { HubSubtopicChips } from "./hub-subtopic-chips";

/** Sticky feed chrome — categories, search, sub-filters (Polymarket stack). */
export function HubFeedChrome() {
  return (
    <div className="hub-feed-chrome">
      <HubCategoryChipBar embedded />
      <div className="hub-container hub-feed-chrome-body">
        <HubFeedSearchRow />
        <HubSubtopicChips />
      </div>
    </div>
  );
}
