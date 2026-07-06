/**
 * Fire-and-forget metrics refresh hook for the realtime ingest worker.
 * Never throws — callers should not await (or void the promise).
 */
export async function triggerMetricsRefresh(params: {
  marketId: string;
  narrativeSlug?: string;
  event: "trade" | "create" | "resolve";
}): Promise<void> {
  try {
    const url = process.env.REALTIME_INGEST_URL;
    if (!url) return;

    const secret = process.env.REALTIME_INGEST_SECRET;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (secret) {
      headers.Authorization = `Bearer ${secret}`;
    }

    await fetch(`${url.replace(/\/$/, "")}/internal/trigger-refresh`, {
      method: "POST",
      headers,
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    // Silently ignore — metrics will catch up on next scheduled run
  }
}
