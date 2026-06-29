import type { TradeModalMarket } from "@/features/trading/store/use-trade-modal-store";
import type { HubMarketEnriched } from "@/shared/contracts/hub-home";
import type { Market } from "@orakly/types";

export function marketToTradeModal(market: Market | HubMarketEnriched): TradeModalMarket {
  return {
    tradeMarketId: market.backendMarketId ?? market.id,
    onChainAddress: market.onChainAddress ?? null,
    chainId: market.chainId ?? null,
    slug: market.slug,
    title: market.title,
    category: market.category,
    midYes: market.probability,
    status: market.status,
    closesAt: market.closesAt,
  };
}
