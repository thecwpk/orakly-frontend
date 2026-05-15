import { MarketStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@orakly/database";
import { err, ok } from "../../_lib/response";

export const dynamic = "force-dynamic";

type Check = { id: string; ok: boolean; detail: string };

function envPresent(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

/**
 * Deep stack probe — Bearer `CRON_SECRET` (same as warm-markets-cache).
 * Run via: npm run verify:vercel (uses .env.local)
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json(err("UNAUTHORIZED", "Bearer CRON_SECRET required"), {
      status: 401,
    });
  }

  const checks: Check[] = [];
  let openMarkets = 0;
  let totalMarkets = 0;

  try {
    totalMarkets = await prisma.market.count();
    openMarkets = await prisma.market.count({
      where: { status: MarketStatus.OPEN },
    });
    checks.push({
      id: "database",
      ok: true,
      detail: `connected · ${openMarkets} OPEN / ${totalMarkets} total`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    checks.push({ id: "database", ok: false, detail: msg });
  }

  const envChecks: Check[] = [
    {
      id: "env.DATABASE_URL",
      ok: envPresent("DATABASE_URL"),
      detail: envPresent("DATABASE_URL") ? "set" : "MISSING",
    },
    {
      id: "env.REALTIME_INGEST",
      ok: envPresent("REALTIME_INGEST_URL") && envPresent("REALTIME_INGEST_SECRET"),
      detail:
        envPresent("REALTIME_INGEST_URL") && envPresent("REALTIME_INGEST_SECRET")
          ? "set"
          : "MISSING ingest URL or secret",
    },
    {
      id: "env.realtime_client",
      ok:
        envPresent("NEXT_PUBLIC_REALTIME_URL") ||
        (envPresent("REALTIME_UPSTREAM_URL") &&
          process.env.NEXT_PUBLIC_REALTIME_SAME_ORIGIN === "true"),
      detail: envPresent("NEXT_PUBLIC_REALTIME_URL")
        ? "direct NEXT_PUBLIC_REALTIME_URL"
        : envPresent("REALTIME_UPSTREAM_URL") &&
            process.env.NEXT_PUBLIC_REALTIME_SAME_ORIGIN === "true"
          ? "same-origin proxy"
          : "MISSING realtime client config",
    },
    {
      id: "env.app_url",
      ok: envPresent("NEXT_PUBLIC_APP_URL") && envPresent("INTERNAL_APP_URL"),
      detail: process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "MISSING",
    },
  ];

  const allOk = checks.every((c) => c.ok) && envChecks.every((c) => c.ok);

  return NextResponse.json(
    ok({
      ok: allOk,
      at: new Date().toISOString(),
      database: { openMarkets, totalMarkets },
      checks: [...checks, ...envChecks],
    }),
  );
}
