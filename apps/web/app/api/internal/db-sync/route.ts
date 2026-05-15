import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { revalidateTag } from "next/cache";
import { MarketStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { runDatabaseSeed } from "@orakly/database/run-seed";
import { prisma } from "@orakly/database";
import { cacheTags } from "@/cache/next-tags";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function runPrismaCli(args: string[]): Promise<{ ok: boolean; detail: string }> {
  const dbRoot = resolve(process.cwd(), "../../packages/database");
  return new Promise((resolvePromise) => {
    const child = spawn("npx", ["prisma", ...args], {
      cwd: dbRoot,
      env: process.env,
      shell: true,
    });
    let out = "";
    child.stdout?.on("data", (c) => {
      out += String(c);
    });
    child.stderr?.on("data", (c) => {
      out += String(c);
    });
    child.on("close", (code) => {
      resolvePromise({
        ok: code === 0,
        detail: out.trim().slice(-400) || `exit ${code ?? "?"}`,
      });
    });
    child.on("error", (e) => {
      resolvePromise({
        ok: false,
        detail: e instanceof Error ? e.message : String(e),
      });
    });
  });
}

/**
 * Sync schema + seed markets on Vercel's `DATABASE_URL`, then bust feed cache.
 * `Authorization: Bearer ${CRON_SECRET}` — same as diagnostics/stack.
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json(
      { ok: false, error: "DATABASE_URL missing on server" },
      { status: 500 },
    );
  }

  let schema: { ok: boolean; detail: string };
  const migrate = await runPrismaCli(["migrate", "deploy"]);
  if (migrate.ok) {
    schema = { ok: true, detail: "migrate deploy" };
  } else {
    const push = await runPrismaCli(["db", "push", "--skip-generate"]);
    schema = push.ok
      ? { ok: true, detail: "db push (migrate deploy failed)" }
      : { ok: false, detail: `migrate: ${migrate.detail}; push: ${push.detail}` };
  }

  let seed: { upserted: number; openCount: number };
  try {
    seed = await runDatabaseSeed();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg, schema }, { status: 500 });
  }

  const openCount = await prisma.market.count({
    where: { status: MarketStatus.OPEN },
  });

  revalidateTag(cacheTags.marketsFeed);
  revalidateTag(cacheTags.cryptoFeed);

  return NextResponse.json({
    ok: schema.ok && openCount > 0,
    schema,
    seed,
    openCount,
    at: new Date().toISOString(),
  });
}
