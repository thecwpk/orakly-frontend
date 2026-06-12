import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { MarketStatus } from "@prisma/client";
import { prisma } from "./client";

/** Run `prisma db seed` programmatically (Vercel db-sync cron). */
export async function runDatabaseSeed(): Promise<{
  upserted: number;
  openCount: number;
}> {
  const dbRoot = resolve(import.meta.dirname, "..");

  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn("npx", ["prisma", "db", "seed"], {
      cwd: dbRoot,
      env: process.env,
      shell: true,
    });
    let detail = "";
    child.stdout?.on("data", (c) => {
      detail += String(c);
    });
    child.stderr?.on("data", (c) => {
      detail += String(c);
    });
    child.on("close", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(detail.trim().slice(-400) || `seed exit ${code ?? "?"}`));
    });
    child.on("error", reject);
  });

  const openCount = await prisma.market.count({
    where: { status: MarketStatus.OPEN },
  });

  return { upserted: openCount, openCount };
}
