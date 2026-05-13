import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import type { Market } from "@orakly/types";
import { createMarketSchema } from "@/api/schemas/create-market";
import { API_ERROR_CODES } from "../../_lib/errors";
import { err, ok } from "../../_lib/response";

/**
 * Public submission endpoint for the `/markets/create` wizard.
 *
 * Distinct from `/api/v1/admin/markets` (admin-gated, Prisma-backed) — this route
 * intentionally accepts a draft market from any visitor and stores it in an
 * in-memory queue for moderation. Production would swap `pendingMarkets` for a
 * `MarketDraft` table with status="PENDING_REVIEW".
 */

type PendingMarket = Market & { createdAt: string; pending: true };

declare global {
  var __oraklyPendingMarkets: PendingMarket[] | undefined;
}

const pendingMarkets: PendingMarket[] =
  globalThis.__oraklyPendingMarkets ??
  (globalThis.__oraklyPendingMarkets = []);

function projectToMarket(input: {
  id: string;
  slug: string;
  title: string;
  category: string;
  liquiditySeedUsd: number;
  initialProbability: number;
  closesAt: string;
}): PendingMarket {
  return {
    id: input.id,
    slug: input.slug,
    title: input.title,
    category: input.category,
    volumeUsd: 0,
    liquidityUsd: input.liquiditySeedUsd,
    probability: input.initialProbability,
    closesAt: input.closesAt,
    status: "OPEN",
    createdAt: new Date().toISOString(),
    pending: true,
  };
}

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      err(API_ERROR_CODES.VALIDATION, "Body must be valid JSON."),
      { status: 400 },
    );
  }

  const parsed = createMarketSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      err(
        API_ERROR_CODES.VALIDATION,
        first?.message ?? "Invalid market submission.",
      ),
      { status: 400 },
    );
  }

  const slugTaken = pendingMarkets.some((m) => m.slug === parsed.data.slug);
  if (slugTaken) {
    return NextResponse.json(
      err(API_ERROR_CODES.VALIDATION, "Slug is already taken."),
      { status: 409 },
    );
  }

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `pending-${Date.now()}`;

  const market = projectToMarket({
    id,
    slug: parsed.data.slug,
    title: parsed.data.title,
    category: parsed.data.category,
    liquiditySeedUsd: parsed.data.liquiditySeedUsd,
    initialProbability: parsed.data.initialProbability,
    closesAt: parsed.data.closesAt,
  });

  pendingMarkets.unshift(market);
  if (pendingMarkets.length > 200) pendingMarkets.length = 200;

  revalidateTag("markets-feed");

  return NextResponse.json(ok(market), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET() {
  return NextResponse.json(ok(pendingMarkets), {
    headers: { "Cache-Control": "no-store" },
  });
}
