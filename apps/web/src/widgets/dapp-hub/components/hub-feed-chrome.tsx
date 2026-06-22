"use client";

import { HubCategoryChipBar } from "./hub-category-chip-bar";
import { HubFeedSearchRow } from "./hub-feed-search-row";

/** Sticky feed chrome — categories + search. */
export function HubFeedChrome() {
  return (
    <div className="hub-feed-chrome">
      <HubCategoryChipBar embedded />
      <div className="hub-container hub-feed-chrome-body">
        <HubFeedSearchRow />
      </div>
    </div>
  );
}
