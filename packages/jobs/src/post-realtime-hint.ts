/**
 * Optional broadcast after ingest — subscribed clients can listen on global feed.
 * Enable with `WORKER_POST_INGEST_REALTIME=true` and REALTIME_INGEST_* env (same as Next.js).
 */
export async function postCryptoIngestRealtimeHint(): Promise<void> {
  if (process.env.WORKER_POST_INGEST_REALTIME !== "true") return;

  const base = process.env.REALTIME_INGEST_URL?.trim().replace(/\/$/, "");
  const secret = process.env.REALTIME_INGEST_SECRET?.trim();
  if (!base || !secret) return;

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 3_000);
  try {
    await fetch(`${base}/internal/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        envelopes: [
          {
            v: 1,
            kind: "feed_activity",
            activity: {
              activityId: `crypto-ingest:${Date.now()}`,
              marketId: null,
              activityType: "CRYPTO_INGEST",
              title: "Discovery snapshot refreshed",
              payload: { at: new Date().toISOString() },
              at: Date.now(),
            },
          },
        ],
      }),
      signal: ac.signal,
    });
  } catch {
    /* fire-and-forget */
  } finally {
    clearTimeout(t);
  }
}
