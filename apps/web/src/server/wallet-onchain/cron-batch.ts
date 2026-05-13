import "server-only";

import { prisma } from "@orakly/database";

import { getWalletOnChainConfig } from "./config";
import { syncWalletOnChainBalances } from "./sync-service";

function envBool(name: string, fallback: boolean): boolean {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  return v === "1" || v.toLowerCase() === "true";
}

function envNum(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

export type WalletOnChainCronResult =
  | { ok: true; skipped: true; reason: string }
  | {
      ok: true;
      skipped: false;
      processedUsers: number;
      synced: number;
      cooldownSkipped: number;
      failures: number;
    }
  | { ok: false; error: string };

/**
 * Best-effort batch tick for Vercel Cron: prioritizes users whose snapshot is oldest.
 */
export async function runWalletOnChainCronBatch(): Promise<WalletOnChainCronResult> {
  if (!envBool("WALLET_ONCHAIN_CRON_ENABLED", false)) {
    return { ok: true, skipped: true, reason: "CRON_DISABLED" };
  }

  const cfg = getWalletOnChainConfig();
  if (!cfg) {
    return { ok: true, skipped: true, reason: "NO_RPC_CONFIG" };
  }

  const batchSize = envNum("WALLET_ONCHAIN_CRON_BATCH_SIZE", 12);
  const staleMs = envNum("WALLET_ONCHAIN_CRON_STALE_MS", 120_000);

  try {
    const cutoff = new Date(Date.now() - staleMs);

    const scan = await prisma.user.findMany({
      where: { walletAddress: { not: null } },
      select: {
        id: true,
        walletOnChainBalances: {
          where: { chainId: cfg.chainId },
          select: { syncedAt: true },
          orderBy: { syncedAt: "desc" },
          take: 1,
        },
      },
      take: Math.min(batchSize * 5, 80),
    });

    const candidates = scan
      .filter(
        (u) =>
          u.walletOnChainBalances.length === 0 ||
          u.walletOnChainBalances[0]!.syncedAt < cutoff,
      )
      .slice(0, batchSize)
      .map((u) => ({ id: u.id }));

    let synced = 0;
    let cooldownSkipped = 0;
    let failures = 0;

    for (const row of candidates) {
      const r = await syncWalletOnChainBalances({ userId: row.id, force: false });
      if (!r.ok) failures += 1;
      else if (r.skipped && r.reason === "COOLDOWN") cooldownSkipped += 1;
      else if (!r.skipped) synced += 1;
    }

    return {
      ok: true,
      skipped: false,
      processedUsers: candidates.length,
      synced,
      cooldownSkipped,
      failures,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
