import type { Market } from "@orakly/types";
import { fetchMarketBySlug } from "@/shared/api/fetchers/markets-live";
import type { TradeModalMarket } from "../store/use-trade-modal-store";

function marketDtoToTradeModal(
  dto: Market,
  seed?: Partial<TradeModalMarket>,
): TradeModalMarket {
  return {
    tradeMarketId:
      seed?.tradeMarketId ??
      dto.backendMarketId ??
      dto.id ??
      null,
    onChainAddress: dto.onChainAddress ?? null,
    chainId: dto.chainId ?? null,
    slug: dto.slug,
    title: dto.title,
    category: dto.category,
    midYes: seed?.midYes ?? dto.probability,
    status: dto.status,
    closesAt: dto.closesAt,
  };
}

/**
 * Ensures `onChainAddress` is present by re-fetching the market by slug when the
 * feed cache is stale (common right after admin deploy).
 */
export async function resolveTradeModalMarket(
  market: TradeModalMarket,
): Promise<TradeModalMarket | null> {
  if (market.onChainAddress?.trim()) {
    return market;
  }
  if (!market.slug?.trim()) {
    return null;
  }

  try {
    const fresh = await fetchMarketBySlug(market.slug);
    if (!fresh.onChainAddress?.trim()) {
      return null;
    }
    return marketDtoToTradeModal(fresh, market);
  } catch {
    return null;
  }
}
