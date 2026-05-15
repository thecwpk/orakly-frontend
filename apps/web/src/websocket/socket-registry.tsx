"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Socket } from "socket.io-client";
import {
  SOCKET_EVENTS,
  type MarketMetaPayload,
  type PortfolioRefreshPayload,
  type RtBatchPayload,
  type TradeInstantPayload,
} from "@orakly/realtime-protocol";
import { resolvePublicRealtimeUrl } from "@/lib/realtime-public-env";
import { createMarketSocket } from "./client/create-socket";
import { applyFeedActivity } from "./store/feed-store";
import {
  applyMarketMeta,
  applyRtBatch,
  applyTradeInstant,
} from "./store/market-realtime-store";
import { bumpPortfolioGeneration } from "./store/portfolio-generation-store";

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

type Registry = {
  subscribeMarket: (marketId: string) => () => void;
  subscribeUserPortfolio: (userId: string) => () => void;
  connectionStatus: ConnectionStatus;
};

const Ctx = createContext<Registry | null>(null);

function resolveWsUrl(): string {
  if (typeof window === "undefined") return "";
  return resolvePublicRealtimeUrl(window.location.origin);
}

export function SocketRegistryProvider({
  children,
  portfolioUserId,
}: {
  children: ReactNode;
  portfolioUserId?: string | null;
}) {
  const socketRef = useRef<Socket | null>(null);
  const marketsRef = useRef(new Set<string>());
  const portfolioRef = useRef<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");

  const flushRooms = useCallback((socket: Socket) => {
    for (const id of marketsRef.current) {
      socket.emit(SOCKET_EVENTS.subscribeMarket, { marketId: id });
    }
    socket.emit(SOCKET_EVENTS.subscribeFeed, {});
    const uid = portfolioRef.current;
    if (uid) {
      socket.emit(SOCKET_EVENTS.subscribeUser, { userId: uid });
    }
  }, []);

  useEffect(() => {
    portfolioRef.current = portfolioUserId ?? null;
    const s = socketRef.current;
    if (s?.connected && portfolioUserId) {
      s.emit(SOCKET_EVENTS.subscribeUser, { userId: portfolioUserId });
    }
  }, [portfolioUserId]);

  useEffect(() => {
    const url = resolveWsUrl().trim();
    if (!url) {
      if (process.env.NODE_ENV === "development") {
        console.info(
          "[orakly] Realtime disabled — set NEXT_PUBLIC_REALTIME_URL or REALTIME_UPSTREAM_URL + NEXT_PUBLIC_REALTIME_SAME_ORIGIN=true. REST APIs still work.",
        );
      }
      setConnectionStatus("disconnected");
      socketRef.current = null;
      return;
    }

    const socket = createMarketSocket({
      url,
      autoConnect: true,
    });
    socketRef.current = socket;

    const onConnect = () => {
      setConnectionStatus("connected");
      flushRooms(socket);
    };

    const onDisconnect = () => {
      setConnectionStatus("disconnected");
    };

    const onConnectError = () => {
      setConnectionStatus("error");
    };

    const onBatch = (payload: RtBatchPayload) => {
      applyRtBatch(payload);
    };

    const onTrade = (payload: TradeInstantPayload) => {
      applyTradeInstant(payload);
    };

    const onMeta = (payload: MarketMetaPayload) => {
      applyMarketMeta(payload);
    };

    const onFeed = (payload: Parameters<typeof applyFeedActivity>[0]) => {
      applyFeedActivity(payload);
    };

    const onPortfolio = (payload: PortfolioRefreshPayload) => {
      bumpPortfolioGeneration(payload.userId);
    };

    setConnectionStatus(socket.connected ? "connected" : "connecting");

    socket.on("connect", onConnect);
    socket.io.on("reconnect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on(SOCKET_EVENTS.rtBatch, onBatch);
    socket.on(SOCKET_EVENTS.tradeInstant, onTrade);
    socket.on(SOCKET_EVENTS.marketMeta, onMeta);
    socket.on(SOCKET_EVENTS.feedActivity, onFeed);
    socket.on(SOCKET_EVENTS.portfolioRefresh, onPortfolio);

    return () => {
      socket.off("connect", onConnect);
      socket.io.off("reconnect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off(SOCKET_EVENTS.rtBatch, onBatch);
      socket.off(SOCKET_EVENTS.tradeInstant, onTrade);
      socket.off(SOCKET_EVENTS.marketMeta, onMeta);
      socket.off(SOCKET_EVENTS.feedActivity, onFeed);
      socket.off(SOCKET_EVENTS.portfolioRefresh, onPortfolio);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [flushRooms]);

  const subscribeMarket = useCallback((marketId: string) => {
    marketsRef.current.add(marketId);
    const s = socketRef.current;
    if (s?.connected) {
      s.emit(SOCKET_EVENTS.subscribeMarket, { marketId });
    }
    return () => {
      marketsRef.current.delete(marketId);
      socketRef.current?.emit(SOCKET_EVENTS.unsubscribeMarket, { marketId });
    };
  }, []);

  const subscribeUserPortfolio = useCallback((userId: string) => {
    portfolioRef.current = userId;
    const s = socketRef.current;
    if (s?.connected) {
      s.emit(SOCKET_EVENTS.subscribeUser, { userId });
    }
    return () => {
      if (portfolioRef.current === userId) portfolioRef.current = null;
      socketRef.current?.emit(SOCKET_EVENTS.unsubscribeUser, { userId });
    };
  }, []);

  const value = useMemo<Registry>(
    () => ({
      subscribeMarket,
      subscribeUserPortfolio,
      connectionStatus,
    }),
    [subscribeMarket, subscribeUserPortfolio, connectionStatus],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSocketRegistry(): Registry {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error("useSocketRegistry must be used within SocketRegistryProvider");
  }
  return v;
}

export function useMarketRoom(marketId: string | undefined) {
  const { subscribeMarket } = useSocketRegistry();
  useEffect(() => {
    if (!marketId) return;
    return subscribeMarket(marketId);
  }, [marketId, subscribeMarket]);
}
