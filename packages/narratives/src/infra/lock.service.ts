import { randomUUID } from "node:crypto";
import { Redis } from "ioredis";

const RELEASE_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

let redis: Redis | null = null;
let redisInitFailed = false;
const lockTokens = new Map<string, string>();

function getLockRedis(): Redis | null {
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
      /* degraded — locks become no-ops */
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

function lockKey(key: string): string {
  return `lock:${key}`;
}

export function marketLockKey(marketId: string): string {
  return `market:${marketId}`;
}

export async function acquireLock(key: string, ttl = 5000): Promise<boolean> {
  const r = getLockRedis();
  if (!r) return true;

  try {
    const token = randomUUID();
    const ok = await r.set(lockKey(key), token, "PX", ttl, "NX");
    if (ok === "OK") {
      lockTokens.set(key, token);
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

export async function releaseLock(key: string): Promise<void> {
  const r = getLockRedis();
  if (!r) return;

  const token = lockTokens.get(key);
  if (!token) return;
  lockTokens.delete(key);

  try {
    await r.eval(RELEASE_SCRIPT, 1, lockKey(key), token);
  } catch {
    /* lock expires via TTL */
  }
}

export async function withMarketLock<T>(
  marketId: string,
  fn: () => Promise<T>,
  ttl = 5000,
): Promise<T | null> {
  const key = marketLockKey(marketId);
  const acquired = await acquireLock(key, ttl);
  if (!acquired) return null;
  try {
    return await fn();
  } finally {
    await releaseLock(key);
  }
}
