import { NextResponse } from "next/server";

/**
 * Warms common `GET /api/v1/markets` slices through the CDN/runtime cache.
 * Vercel Cron — Bearer `CRON_SECRET`.
 *
 * Set `INTERNAL_APP_URL` to full origin (e.g. `https://your-app.vercel.app`) when `VERCEL_URL` is insufficient.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const base =
    process.env.INTERNAL_APP_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  if (!base) {
    return NextResponse.json(
      { ok: false, error: "Missing INTERNAL_APP_URL or VERCEL_URL" },
      { status: 500 },
    );
  }

  const paths = [
    "/api/v1/markets?scope=full&lane=directory&take=120",
    "/api/v1/markets?scope=full&lane=list&filter=cross_hot&take=120",
    "/api/v1/markets?scope=full&lane=list&filter=breaking&take=120",
  ];

  const results = await Promise.allSettled(
    paths.map((p) =>
      fetch(`${base}${p}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      }),
    ),
  );

  const ok = results.every(
    (r) => r.status === "fulfilled" && r.value.ok,
  );

  return NextResponse.json({
    ok,
    warmed: paths.length,
    results: results.map((r, i) =>
      r.status === "fulfilled"
        ? { path: paths[i]!, status: r.value.status }
        : { path: paths[i]!, error: String(r.reason) },
    ),
  });
}
