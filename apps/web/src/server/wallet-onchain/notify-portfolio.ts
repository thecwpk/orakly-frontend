import "server-only";

import type { IngestEnvelope } from "@orakly/realtime-protocol";

function ingestUrl(): string | null {
  const raw = process.env.REALTIME_INGEST_URL?.trim();
  return raw ? raw.replace(/\/$/, "") : null;
}

function ingestSecret(): string | null {
  const s = process.env.REALTIME_INGEST_SECRET?.trim();
  return s || null;
}

async function postIngest(envelopes: IngestEnvelope[]): Promise<void> {
  const base = ingestUrl();
  const secret = ingestSecret();
  if (!base || !secret || envelopes.length === 0) return;

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 3_000);
  try {
    await fetch(`${base}/internal/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ envelopes }),
      signal: ac.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

/** Hint subscribed clients to refetch portfolio (includes on-chain snapshot). */
export function publishWalletOnChainSynced(userId: string): void {
  const at = Date.now();
  const envelopes: IngestEnvelope[] = [
    {
      v: 1,
      kind: "portfolio_refresh",
      portfolio: { userId, reason: "onchain", at },
    },
  ];

  void postIngest(envelopes).catch((err) => {
    console.error("[realtime] publishWalletOnChainSynced failed", err);
  });
}
