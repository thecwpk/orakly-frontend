/**
 * Server query layer: use from Route Handlers, Server Components, and Server Actions only.
 */
import { getMarketsFeedScoped } from "./markets-feed-scoped";

/** @deprecated Prefer `getMarketsFeedScoped` with explicit lane — kept for older imports. */
export async function getMarketsForFeed() {
  return getMarketsFeedScoped({
    scope: "full",
    lane: "directory",
    take: 80,
  });
}
