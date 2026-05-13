import { fetchMarketsV1 } from "@/api/endpoints/markets";
import type { Market } from "@orakly/types";
import type { ApiResult } from "@/api/types";

/**
 * Application service: orchestrates API calls and future caching rules.
 */
export async function loadMarkets(): Promise<ApiResult<Market[]>> {
  return fetchMarketsV1();
}
