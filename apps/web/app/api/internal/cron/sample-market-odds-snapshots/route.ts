import { NextResponse } from "next/server";
import { MarketStatus } from "@prisma/client";
import { prisma } from "@orakly/database";

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const CHUNK = 400;

/**
 * Append one snapshot per open market (current YES mid) — feed for `filter=movers_24h`.
 * Vercel Cron — Bearer `CRON_SECRET`. Prunes rows older than retention (30d).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const now = new Date();
  const markets = await prisma.market.findMany({
    where: { status: MarketStatus.OPEN, yesPrice: { not: null } },
    select: { id: true, yesPrice: true },
  });

  let inserted = 0;
  for (let i = 0; i < markets.length; i += CHUNK) {
    const slice = markets.slice(i, i + CHUNK);
    const res = await prisma.marketOddsSnapshot.createMany({
      data: slice.map((m) => ({
        marketId: m.id,
        midYes: m.yesPrice!,
        recordedAt: now,
      })),
    });
    inserted += res.count;
  }

  const pruned = await prisma.marketOddsSnapshot.deleteMany({
    where: { recordedAt: { lt: new Date(Date.now() - RETENTION_MS) } },
  });

  return NextResponse.json({
    ok: true,
    sampledAt: now.toISOString(),
    inserted,
    pruned: pruned.count,
  });
}
