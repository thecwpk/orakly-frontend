import { Redis } from "ioredis";
import { CACHE_TTL_MS } from "./constants.js";

type CacheEntry<T> = { value: T; expiresAt: number };

const memory = new Map<string, CacheEntry<unknown>>();
let redis: Redis | null = null;
let redisInitFailed = false;

function getRedis(): Redis | null {
  if (redisInitFailed) return null;
  if (redis) return redis;
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;
  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    redis.on("error", () => {
      /* fall back to memory */
    });
    void redis.connect().catch(() => {
      redisInitFailed = true;
      redis = null;
    });
    return redis;
  } catch {
    redisInitFailed = true;
    return null;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (r) {
    try {
      const raw = await r.get(`narratives:cache:${key}`);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      /* memory fallback */
    }
  }

  const row = memory.get(key);
  if (!row) return null;
  if (Date.now() > row.expiresAt) {
    memory.delete(key);
    return null;
  }
  return row.value as T;
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlMs = CACHE_TTL_MS,
): Promise<void> {
  const r = getRedis();
  if (r) {
    try {
      await r.set(`narratives:cache:${key}`, JSON.stringify(value), "PX", ttlMs);
      return;
    } catch {
      /* memory fallback */
    }
  }

  if (memory.size > 500) {
    const first = memory.keys().next().value as string | undefined;
    if (first) memory.delete(first);
  }
  memory.set(key, { value, expiresAt: Date.now() + ttlMs });
}
