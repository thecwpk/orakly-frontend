import { prisma } from "@orakly/database";
import { Redis } from "ioredis";

export type SystemHealthReport = {
  ok: boolean;
  service: string;
  checkedAt: string;
  redis: { ok: boolean; latencyMs: number | null };
  database: { ok: boolean; latencyMs: number | null };
  workers: { ok: boolean; lagMs: number | null };
  api: { ok: boolean; latencyMs: number | null };
};

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;
  redis = new Redis(url, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    enableOfflineQueue: false,
  });
  return redis;
}

async function pingRedis(): Promise<{ ok: boolean; latencyMs: number | null }> {
  const r = getRedis();
  if (!r) return { ok: false, latencyMs: null };
  const start = Date.now();
  try {
    await r.connect().catch(() => undefined);
    const pong = await r.ping();
    return { ok: pong === "PONG", latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: null };
  }
}

async function pingDatabase(): Promise<{
  ok: boolean;
  latencyMs: number | null;
}> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: null };
  }
}

async function estimateWorkerLag(): Promise<{
  ok: boolean;
  lagMs: number | null;
}> {
  const r = getRedis();
  if (!r) return { ok: false, lagMs: null };
  try {
    await r.connect().catch(() => undefined);
    const key = "orakly:health:worker:lastBeat";
    const raw = await r.get(key);
    if (!raw) return { ok: true, lagMs: null };
    const lagMs = Date.now() - Number(raw);
    return { ok: lagMs < 120_000, lagMs };
  } catch {
    return { ok: false, lagMs: null };
  }
}

export async function recordWorkerHeartbeat(): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set("orakly:health:worker:lastBeat", String(Date.now()), "PX", 300_000);
  } catch {
    /* best effort */
  }
}

export async function getSystemHealth(): Promise<SystemHealthReport> {
  const start = Date.now();
  const [redisResult, dbResult, workerResult] = await Promise.all([
    pingRedis(),
    pingDatabase(),
    estimateWorkerLag(),
  ]);

  const apiLatencyMs = Date.now() - start;
  const ok =
    redisResult.ok && dbResult.ok && workerResult.ok;

  return {
    ok,
    service: "orakly-api",
    checkedAt: new Date().toISOString(),
    redis: redisResult,
    database: dbResult,
    workers: workerResult,
    api: { ok: apiLatencyMs < 5_000, latencyMs: apiLatencyMs },
  };
}
