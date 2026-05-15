#!/usr/bin/env node
/**
 * Local stack check before `npm run dev` — DB sync/seed + warm API caches + realtime health.
 *
 * Usage (from repo root):
 *   npm run bootstrap:dev
 * Or apps/web:
 *   node scripts/bootstrap-dev.mjs
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(__dirname, "..");
const monoRoot = resolve(webRoot, "../..");

const envPath = resolve(webRoot, ".env.local");
if (existsSync(envPath)) {
  config({ path: envPath });
  console.log("[bootstrap-dev] loaded .env.local");
} else {
  console.warn("[bootstrap-dev] no .env.local — using process.env only");
}

const log = (m) => console.log(`[bootstrap-dev] ${m}`);
const warn = (m) => console.warn(`[bootstrap-dev] ${m}`);

function run(cmd, args, cwd) {
  log(`$ ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  return r.status ?? 1;
}

async function fetchStatus(url, init = {}) {
  try {
    const res = await fetch(url, init);
    return res.status;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

const HUB_PATHS = [
  "/api/v1/markets?scope=hub&lane=list&filter=trending&take=28",
  "/api/v1/markets?scope=hub&lane=trending&trendingBy=volume&take=28",
  "/api/v1/markets?scope=hub&lane=trending&trendingBy=activity&take=28",
  "/api/v1/markets?scope=hub&lane=trending&trendingBy=hot&take=28",
  "/api/v1/markets?scope=hub&lane=trending&trendingBy=new&take=28",
  "/api/v1/markets?scope=full&lane=directory&take=120",
];

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL missing in .env.local");
  }

  log("db:generate");
  if (run("npm", ["run", "db:generate", "--workspace=@orakly/database"], monoRoot) !== 0) {
    throw new Error("db:generate failed");
  }

  log("schema sync (push)");
  if (run("npm", ["run", "db:push", "--workspace=@orakly/database"], monoRoot) !== 0) {
    warn("db:push failed — continue if DB already synced");
  }

  log("seed");
  if (run("npm", ["run", "db:seed", "--workspace=@orakly/database"], monoRoot) !== 0) {
    warn("db:seed failed");
  }

  const rt = process.env.REALTIME_INGEST_URL?.trim().replace(/\/$/, "");
  if (rt) {
    const st = await fetchStatus(`${rt}/health`);
    log(`realtime /health → ${st}`);
  } else {
    warn("REALTIME_INGEST_URL unset");
  }

  const app =
    process.env.INTERNAL_APP_URL?.trim().replace(/\/$/, "") ||
    "http://localhost:3000";

  const healthSt = await fetchStatus(`${app}/api/v1/health`);
  if (healthSt === 200) {
    log(`app up (${app}) — warming market routes`);
    for (const p of HUB_PATHS) {
      const st = await fetchStatus(`${app}${p}`, {
        headers: { Accept: "application/json" },
      });
      log(`${p} → ${st}`);
    }
  } else {
    warn(`app not running (${app}/api/v1/health → ${healthSt})`);
    warn("Start dev server: cd apps/web && npm run dev — then re-run bootstrap or refresh /dapp");
  }

  log("done — run: cd apps/web && npm run dev");
}

main().catch((e) => {
  console.error("[bootstrap-dev] fatal:", e);
  process.exit(1);
});
