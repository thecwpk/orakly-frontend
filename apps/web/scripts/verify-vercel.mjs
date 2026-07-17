#!/usr/bin/env node
/**
 * Verify deployed Vercel frontend ↔ backend wiring.
 *
 *   npm run verify:vercel
 *   npm run verify:vercel -- https://orakly-frontend-web.vercel.app
 *
 * Loads apps/web/.env.local for CRON_SECRET + REALTIME_* when present.
 */
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(__dirname, "..");
const envPath = resolve(webRoot, ".env.local");
if (existsSync(envPath)) config({ path: envPath });

const base = (process.argv[2] || process.env.NEXT_PUBLIC_APP_URL || "")
  .trim()
  .replace(/\/$/, "");

if (!base) {
  console.error("Usage: npm run verify:vercel -- https://your-app.vercel.app");
  console.error("Or set NEXT_PUBLIC_APP_URL in .env.local");
  process.exit(1);
}

const cronSecret = process.env.CRON_SECRET?.trim();
const revalidateSecret = process.env.VERCEL_REVALIDATE_SECRET?.trim();
const vercelOnly =
  process.env.ORAKLY_VERCEL_ONLY === "true" ||
  process.env.NEXT_PUBLIC_ORAKLY_VERCEL_ONLY === "true";
const realtimeBase = process.env.REALTIME_INGEST_URL?.trim().replace(/\/$/, "");
const sameOrigin = process.env.NEXT_PUBLIC_REALTIME_SAME_ORIGIN === "true";
const socketBase = sameOrigin ? base : process.env.NEXT_PUBLIC_REALTIME_URL?.trim().replace(/\/$/, "");

const HUB_CHECKS = [
  { name: "hub list/trending", path: "/api/v1/markets?scope=hub&lane=list&filter=trending&take=8" },
  { name: "hub trending/volume", path: "/api/v1/markets?scope=hub&lane=trending&trendingBy=volume&take=8" },
  { name: "hub trending/activity", path: "/api/v1/markets?scope=hub&lane=trending&trendingBy=activity&take=8" },
  { name: "hub trending/hot", path: "/api/v1/markets?scope=hub&lane=trending&trendingBy=hot&take=8" },
  { name: "hub trending/new", path: "/api/v1/markets?scope=hub&lane=trending&trendingBy=new&take=8" },
  { name: "directory", path: "/api/v1/markets?scope=full&lane=directory&take=8" },
];

const results = [];
let failed = 0;

function pass(name, detail) {
  results.push({ name, ok: true, detail });
  console.log(`  PASS ${name}: ${detail}`);
}

function fail(name, detail) {
  results.push({ name, ok: false, detail });
  failed++;
  console.log(`  FAIL ${name}: ${detail}`);
}

async function getJson(url, init = {}) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 20_000);
  try {
    const res = await fetch(url, { ...init, signal: ac.signal });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    return { ok: res.ok, status: res.status, json, text: text.slice(0, 200) };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      json: null,
      text: e instanceof Error ? e.message : String(e),
    };
  } finally {
    clearTimeout(t);
  }
}

function marketsFromPayload(json) {
  if (!json?.ok || !Array.isArray(json.data)) return { count: 0, sample: null };
  const first = json.data[0];
  return {
    count: json.data.length,
    sample: first?.title ?? first?.slug ?? null,
  };
}

console.log("\n══════════════════════════════════════════");
console.log("  Orakly Vercel stack verify");
console.log(`  Target: ${base}`);
console.log("══════════════════════════════════════════\n");

console.log("── DB sync + cache (production) ──\n");

if (cronSecret) {
  const sync = await getJson(`${base}/api/internal/db-sync`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cronSecret}` },
  });
  if (sync.status === 404) {
    fail(
      "POST /api/internal/db-sync",
      "404. Redeploy frontend, then set Vercel DATABASE_URL to the Neon URL from .env.local",
    );
  } else if (sync.ok && sync.json?.openCount > 0) {
    pass(
      "POST /api/internal/db-sync",
      `${sync.json.openCount} OPEN markets · schema ${sync.json.schema?.detail ?? "ok"}`,
    );
  } else if (sync.ok) {
    fail(
      "POST /api/internal/db-sync",
      "seed ran but 0 OPEN. Check that Vercel DATABASE_URL matches Neon in .env.local",
    );
  } else {
    fail("POST /api/internal/db-sync", `HTTP ${sync.status} · ${sync.text}`);
  }
} else {
  fail("POST /api/internal/db-sync", "CRON_SECRET missing in .env.local");
}

if (revalidateSecret) {
  const rev = await getJson(`${base}/api/internal/revalidate-feed`, {
    method: "POST",
    headers: { Authorization: `Bearer ${revalidateSecret}` },
  });
  if (rev.ok && rev.json?.ok) pass("POST /api/internal/revalidate-feed", "markets-feed tag busted");
  else fail("POST /api/internal/revalidate-feed", `HTTP ${rev.status} · ${rev.text}`);
} else {
  fail("revalidate-feed", "VERCEL_REVALIDATE_SECRET missing in .env.local");
}

console.log("\n── App API ──\n");

{
  const r = await getJson(`${base}/api/v1/health`);
  if (r.ok && r.json?.ok) pass("GET /api/v1/health", `200 · ts ${r.json.data?.ts ?? "N/A"}`);
  else fail("GET /api/v1/health", `HTTP ${r.status} ${r.text}`);
}

for (const c of HUB_CHECKS) {
  const r = await getJson(`${base}${c.path}`);
  const { count, sample } = marketsFromPayload(r.json);
  if (r.ok && r.json?.ok && count > 0) {
    pass(c.name, `${count} markets · e.g. "${sample}"`);
  } else if (r.ok && r.json?.ok && count === 0) {
    fail(c.name, "0 markets. DB empty or hub scope blocked. Run seed on DATABASE_URL");
  } else {
    fail(c.name, `HTTP ${r.status} · ${r.text}`);
  }
}

console.log("\n── Server diagnostics (DB + env on Vercel) ──\n");

if (cronSecret) {
  const r = await getJson(`${base}/api/v1/diagnostics/stack`, {
    headers: { Authorization: `Bearer ${cronSecret}` },
  });
  if (r.ok && r.json?.ok) {
    const data = r.json.data;
    pass("GET /api/v1/diagnostics/stack", data?.checks?.find((x) => x.id === "database")?.detail ?? "ok");
    for (const c of data?.checks ?? []) {
      if (c.id === "database") continue;
      if (c.ok) pass(`  env ${c.id}`, c.detail);
      else fail(`  env ${c.id}`, c.detail);
    }
  } else {
    fail("GET /api/v1/diagnostics/stack", `HTTP ${r.status}. Redeploy frontend with latest main`);
  }
} else {
  fail("diagnostics/stack", "CRON_SECRET missing in .env.local. Cannot probe Vercel DB");
}

console.log("\n── Realtime (Railway) ──\n");

if (vercelOnly) {
  pass("Vercel-only mode", "ORAKLY_VERCEL_ONLY enabled. Skipping Railway realtime checks");
} else if (realtimeBase) {
  const r = await getJson(`${realtimeBase}/health`);
  if (r.ok) pass("Railway realtime /health", realtimeBase);
  else fail("Railway realtime /health", `HTTP ${r.status} ${r.text}`);
} else {
  fail("Railway realtime /health", "REALTIME_INGEST_URL not in .env.local");
}

if (vercelOnly) {
  pass("Socket.IO polling", "skipped. Activity tape uses REST polling");
} else if (socketBase) {
  const pollUrl = `${socketBase}/socket.io/?EIO=4&transport=polling`;
  const r = await getJson(pollUrl);
  if (r.ok && r.text.includes("sid")) {
    pass("Socket.IO polling", sameOrigin ? "via Vercel proxy" : "direct Railway");
  } else {
    fail("Socket.IO polling", `HTTP ${r.status}. Check REALTIME_UPSTREAM and SAME_ORIGIN on Vercel`);
  }
} else {
  fail("Socket.IO polling", "no socket base URL (set SAME_ORIGIN or NEXT_PUBLIC_REALTIME_URL)");
}

console.log("\n── Pages ──\n");

for (const path of ["/", "/dapp", "/discover"]) {
  const r = await getJson(`${base}${path}`, { headers: { Accept: "text/html" } });
  if (r.ok) pass(`GET ${path}`, `HTTP ${r.status}`);
  else fail(`GET ${path}`, `HTTP ${r.status}`);
}

console.log("\n══════════════════════════════════════════");
if (failed === 0) {
  console.log(
    vercelOnly
      ? "  ALL CHECKS PASSED. Vercel-only stack (REST + crons) looks wired."
      : "  ALL CHECKS PASSED. Backend, markets, and realtime look wired.",
  );
} else {
  console.log(`  ${failed} CHECK(S) FAILED. Fix items marked FAIL above.`);
}
console.log("══════════════════════════════════════════\n");

process.exit(failed > 0 ? 1 : 0);
