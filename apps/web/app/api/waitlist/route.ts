import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

/**
 * Waitlist submission endpoint.
 *
 * Per product decision: log-only sink. Real ESP/DB wiring lands later.
 * Contract here is stable so swapping the body of `recordSignup()` for
 * Prisma / ConvertKit / Resend is a one-file change.
 *
 * Spam mitigations:
 *   - Honeypot field `company` — bots fill every text input. Real users
 *     never see it (hidden in the form). Silently 200 on hits.
 *   - Per-IP token bucket (in-memory) — caps at 5 submissions / 5 minutes.
 *     Resets on serverless cold start; good enough for log-only intake.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PayloadSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  /** Honeypot. Must be empty. */
  company: z.string().max(0).optional().default(""),
  /** Free-text source tag for funnel attribution. */
  source: z.string().max(64).optional(),
});

type WaitlistEntry = {
  email: string;
  source?: string;
  receivedAt: string;
  ip: string;
  ua: string;
};

const BUCKET = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 5 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function rateLimit(ip: string): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = BUCKET.get(ip);
  if (!entry || entry.resetAt < now) {
    BUCKET.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryAfterSec: 0 };
  }
  if (entry.count >= MAX_PER_WINDOW) {
    return { ok: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

async function recordSignup(entry: WaitlistEntry): Promise<void> {
  // TODO: swap for Prisma write / ESP forward when product wires durable sink.
  console.info("[waitlist] signup", entry);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = PayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid email", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Honeypot tripped — pretend success so bots stop probing.
  if (parsed.data.company && parsed.data.company.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const ip = clientIp(req);
  const limit = rateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions, try again soon" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  await recordSignup({
    email: parsed.data.email,
    source: parsed.data.source,
    receivedAt: new Date().toISOString(),
    ip,
    ua: req.headers.get("user-agent") ?? "unknown",
  });

  return NextResponse.json({ ok: true });
}

export function GET() {
  return NextResponse.json({ ok: false, error: "POST only" }, { status: 405 });
}
