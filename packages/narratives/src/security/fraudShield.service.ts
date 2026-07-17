import { prisma } from "@orakly/database";
import { cacheGet, cacheSet } from "../lib/cache.js";

export class FraudShieldError extends Error {
  readonly code: string;
  readonly status: number;
  readonly retryAfterMs?: number;

  constructor(
    code: string,
    message: string,
    status = 403,
    retryAfterMs?: number,
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

const SPAM_WINDOW_MS = 60_000;
const SPAM_TRADE_THRESHOLD = 25;
const CIRCULAR_WINDOW_MS = 120_000;
const SYBIL_TRADE_THRESHOLD = 15;

async function incrementCounter(
  key: string,
  windowMs: number,
): Promise<number> {
  const row = await cacheGet<{ count: number; expiresAt: number }>(key);
  const now = Date.now();
  if (!row || now > row.expiresAt) {
    await cacheSet(key, { count: 1, expiresAt: now + windowMs }, windowMs);
    return 1;
  }
  const count = row.count + 1;
  await cacheSet(
    key,
    { count, expiresAt: row.expiresAt },
    row.expiresAt - now,
  );
  return count;
}

export async function assertTradeAllowed(
  userId: string,
  marketId: string,
): Promise<void> {
  const spamKey = `fraud:spam:${userId}`;
  const spamCount = await incrementCounter(spamKey, SPAM_WINDOW_MS);
  if (spamCount > SPAM_TRADE_THRESHOLD) {
    const cooldown = Math.min(60_000, 2 ** (spamCount - SPAM_TRADE_THRESHOLD) * 1000);
    throw new FraudShieldError(
      "TRADE_SPAM",
      "Trade frequency blocked. Cooldown active",
      429,
      cooldown,
    );
  }

  const market = await prisma.market.findUnique({
    where: { id: marketId },
    select: { generationMeta: true },
  });
  const meta =
    typeof market?.generationMeta === "object" && market.generationMeta
      ? (market.generationMeta as { throttledWallets?: string[]; flaggedWallets?: string[] })
      : {};
  const throttled = new Set([
    ...(meta.throttledWallets ?? []),
    ...(meta.flaggedWallets ?? []),
  ]);
  if (throttled.has(userId)) {
    const throttleKey = `fraud:throttle:${userId}`;
    const n = await incrementCounter(throttleKey, 60_000);
    if (n > 5) {
      throw new FraudShieldError(
        "WALLET_THROTTLED",
        "Wallet throttled due to manipulation flags",
        429,
        60_000,
      );
    }
  }

  const since = new Date(Date.now() - CIRCULAR_WINDOW_MS);
  const recent = await prisma.trade.findMany({
    where: {
      marketId,
      OR: [{ buyerId: userId }, { sellerId: userId }],
      executedAt: { gte: since },
    },
    select: { buyerId: true, sellerId: true, outcome: true },
    take: 20,
  });

  let flips = 0;
  let lastOutcome: string | null = null;
  for (const t of recent) {
    const side = t.outcome;
    if (lastOutcome && lastOutcome !== side) flips += 1;
    lastOutcome = side;
  }
  if (flips >= 4) {
    throw new FraudShieldError(
      "CIRCULAR_TRADING",
      "Circular trading pattern detected",
      403,
    );
  }
}

export async function detectSybilPattern(marketId: string): Promise<string[]> {
  const since = new Date(Date.now() - 10 * 60_000);
  const trades = await prisma.trade.findMany({
    where: { marketId, executedAt: { gte: since } },
    select: { buyerId: true, notionalUsd: true },
  });

  const counts = new Map<string, number>();
  for (const t of trades) {
    counts.set(t.buyerId, (counts.get(t.buyerId) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, c]) => c >= SYBIL_TRADE_THRESHOLD)
    .map(([id]) => id);
}
