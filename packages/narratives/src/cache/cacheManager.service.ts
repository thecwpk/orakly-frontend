import { cacheGet, cacheSet } from "../lib/cache.js";
import type { MarketProbabilityResult } from "../engines/probabilityEngine.service.js";

const KEYS = {
  market: (id: string) => `market:${id}`,
  wallet: (userId: string) => `wallet:${userId}`,
  dashboardAttention: "dashboard:attention",
  dashboardTrends: "dashboard:trends",
  idempotency: (key: string) => `idempotency:${key}`,
} as const;

const MARKET_TTL_MS = 60_000;
const DASHBOARD_TTL_MS = 10 * 60_000;
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60_000;

export const cacheManager = {
  keys: KEYS,

  async getMarket<T>(marketId: string): Promise<T | null> {
    return cacheGet<T>(KEYS.market(marketId));
  },

  async setMarket<T>(marketId: string, value: T): Promise<void> {
    await cacheSet(KEYS.market(marketId), value, MARKET_TTL_MS);
  },

  async invalidateMarket(marketId: string): Promise<void> {
    await cacheSet(KEYS.market(marketId), null, 1);
  },

  async getDashboardAttention<T>(): Promise<T | null> {
    return cacheGet<T>(KEYS.dashboardAttention);
  },

  async setDashboardAttention<T>(value: T): Promise<void> {
    await cacheSet(KEYS.dashboardAttention, value, DASHBOARD_TTL_MS);
  },

  async invalidateDashboardAttention(): Promise<void> {
    await cacheSet(KEYS.dashboardAttention, null, 1);
  },

  async invalidateDashboardTrends(): Promise<void> {
    await cacheSet(KEYS.dashboardTrends, null, 1);
  },

  async onTradeCreated(marketId: string): Promise<void> {
    await this.invalidateMarket(marketId);
  },

  async getWalletBalance<T>(userId: string): Promise<T | null> {
    return cacheGet<T>(KEYS.wallet(userId));
  },

  async setWalletBalance<T>(userId: string, value: T): Promise<void> {
    await cacheSet(KEYS.wallet(userId), value, MARKET_TTL_MS);
  },

  async onLedgerUpdated(userId: string): Promise<void> {
    await cacheSet(KEYS.wallet(userId), null, 1);
  },

  async onProbabilityUpdated(
    marketId: string,
    result: MarketProbabilityResult,
  ): Promise<void> {
    await this.writeThroughProbability(marketId, result);
  },

  /** Write-through: cache always mirrors last committed probability. */
  async writeThroughProbability(
    marketId: string,
    result: MarketProbabilityResult,
  ): Promise<void> {
    await this.setMarket(marketId, result);
  },

  async onMarketResolved(marketId: string): Promise<void> {
    await this.invalidateMarket(marketId);
    await this.invalidateDashboardAttention();
    await this.invalidateDashboardTrends();
  },

  async onNarrativeUpdated(): Promise<void> {
    await this.invalidateDashboardAttention();
    await this.invalidateDashboardTrends();
  },

  async getIdempotencyResponse<T>(key: string): Promise<T | null> {
    return cacheGet<T>(KEYS.idempotency(key));
  },

  async storeIdempotencyResponse<T>(key: string, body: T): Promise<void> {
    await cacheSet(KEYS.idempotency(key), body, IDEMPOTENCY_TTL_MS);
  },
};
