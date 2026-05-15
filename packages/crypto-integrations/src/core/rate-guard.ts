const buckets = new Map<string, number[]>();

export type RateGuardResult =
  | { ok: true }
  | { ok: false; retryAfterMs: number };

/**
 * Per-instance sliding window (fits warm Vercel lambdas). Pair with conservative caps.
 */
export function hitRateGuard(key: string, maxPerMinute: number): RateGuardResult {
  const now = Date.now();
  const windowStart = now - 60_000;
  const stamps = buckets.get(key)?.filter((t) => t > windowStart) ?? [];

  if (stamps.length >= maxPerMinute) {
    const oldestInWindow = stamps[0]!;
    return { ok: false, retryAfterMs: Math.max(0, oldestInWindow + 60_001 - now) };
  }

  stamps.push(now);
  buckets.set(key, stamps);
  return { ok: true };
}
