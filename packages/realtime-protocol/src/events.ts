/** Socket.IO wire events — server ↔ client. */
export const SOCKET_EVENTS = {
  /** Server → client: connection metadata + suggested backoff on reconnect. */
  connectionAck: "connection:ack",
  /** Client → server: join a market channel (odds, trades, batched ticks). */
  subscribeMarket: "subscribe:market",
  subscribeFeed: "subscribe:feed",
  subscribeUser: "subscribe:user",
  unsubscribeMarket: "unsubscribe:market",
  unsubscribeFeed: "unsubscribe:feed",
  unsubscribeUser: "unsubscribe:user",
  /** Batched deltas for a single market (odds + volume + optional trade rows). */
  rtBatch: "rt:batch",
  /** Low-latency trade line (also duplicated inside batches when coalesced). */
  tradeInstant: "trade:instant",
  /** Global activity feed (cross-market). */
  feedActivity: "feed:activity",
  /** Market-level meta patch (status, close time, resolution). */
  marketMeta: "market:meta",
  /** Hint to refetch wallet/portfolio for the subscribed user. */
  portfolioRefresh: "portfolio:refresh",
} as const;

export type SocketEventName =
  (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
