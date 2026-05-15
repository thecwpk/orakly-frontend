import { MarketStatus, Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

export function computeExternalMomentumScore(
  signal: {
    providers: string[];
    hotScore: Prisma.Decimal;
    volatilityScore: Prisma.Decimal;
    volumeScore: Prisma.Decimal;
    pairCreatedAt: Date | null;
  },
  now: Date,
): Prisma.Decimal {
  const n = signal.providers.length;
  const hot = Number(signal.hotScore);
  const vol = Number(signal.volatilityScore);
  const vs = Number(signal.volumeScore);

  let newness = 0;
  if (signal.pairCreatedAt) {
    const hours =
      (now.getTime() - signal.pairCreatedAt.getTime()) / 3_600_000;
    if (hours < 96) newness = Math.max(0, 48 - hours * 0.45);
  }

  const raw = hot + n * 7 + vol * 0.35 + vs * 0.2 + newness;
  const capped = Math.min(999_999, Math.max(0, raw));
  return new Prisma.Decimal(capped.toFixed(6));
}

/**
 * Copies latest signal telemetry onto OPEN markets linked via `cryptoSignalId`.
 */
export async function syncOpenMarketDiscoveryFromSignals(
  db: PrismaClient,
  now: Date,
): Promise<number> {
  const rows = await db.market.findMany({
    where: {
      status: MarketStatus.OPEN,
      cryptoSignalId: { not: null },
    },
    select: { id: true, cryptoSignalId: true },
  });

  const chunkSize = 60;
  let touched = 0;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const slice = rows.slice(i, i + chunkSize);
    const sigIds = slice.map((r) => r.cryptoSignalId!);
    const signals = await db.cryptoTokenSignal.findMany({
      where: { id: { in: sigIds } },
    });
    const byId = new Map(signals.map((s) => [s.id, s]));

    await db.$transaction(
      slice.map((r) => {
        const s = byId.get(r.cryptoSignalId!);
        if (!s) {
          return db.market.update({
            where: { id: r.id },
            data: {
              signalProviderCount: 0,
              signalHotScore: null,
              signalLastSeenAt: null,
              externalMomentumScore: new Prisma.Decimal(0),
            },
          });
        }
        return db.market.update({
          where: { id: r.id },
          data: {
            signalProviderCount: s.providers.length,
            signalHotScore: s.hotScore,
            signalLastSeenAt: s.lastSeenAt,
            externalMomentumScore: computeExternalMomentumScore(s, now),
          },
        });
      }),
    );
    touched += slice.length;
  }

  return touched;
}
