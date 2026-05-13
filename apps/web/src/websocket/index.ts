export { createMarketSocket } from "./client/create-socket";
export type { MarketSocketOptions } from "./client/create-socket";
export {
  SOCKET_EVENTS,
  type SocketEventName,
} from "@orakly/realtime-protocol";
export type {
  FeedActivityPayload,
  IngestEnvelope,
  MarketMetaPayload,
  RtBatchItem,
  RtBatchPayload,
  TradeInstantPayload,
} from "@orakly/realtime-protocol";
export { globalFeedRoom, marketRoom, userPortfolioRoom } from "@orakly/realtime-protocol";

export { SocketRegistryProvider, useSocketRegistry, useMarketRoom } from "./socket-registry";
export { useMarketRealtime } from "./hooks/useMarketRealtime";
export { useLiveActivityFeed } from "./hooks/useLiveActivityFeed";
export { usePortfolioRealtimeTick } from "./hooks/usePortfolioRealtimeTick";
