import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { API_ERROR_CODES } from "../_lib/errors";
import { err, ok } from "../_lib/response";
import { resolveWalletSessionFromCookies } from "@/server/wallet-auth/resolve-wallet-session";
import {
  createCommunitySuggestion,
  listCommunitySuggestions,
  parseSort,
  parseStatusFilter,
} from "@/server/suggestions/community-suggestions";

const createBodySchema = z.object({
  question: z.string().trim().min(10).max(200),
  category: z.string().trim().min(1).max(64),
  description: z.string().trim().max(4000).optional(),
  resolutionSource: z.string().trim().max(2000).optional(),
  narrative: z.string().trim().max(64).optional(),
  resolvesAt: z.string().trim().min(8).max(40),
});

/** GET /api/v1/suggestions — list community market suggestions (public). */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const status = parseStatusFilter(searchParams.get("status"));
    const sort = parseSort(searchParams.get("sort"));
    const address = searchParams.get("address")?.trim() || undefined;
    const limitRaw = Number.parseInt(searchParams.get("limit") ?? "", 10);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : undefined;

    const data = await listCommunitySuggestions({ status, sort, address, limit });

    return NextResponse.json(ok(data), {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(err("SUGGESTIONS_UNAVAILABLE", message), { status: 503 });
  }
}

/** POST /api/v1/suggestions — submit a community market idea (wallet session). */
export async function POST(req: NextRequest) {
  const session = await resolveWalletSessionFromCookies();
  if (!session?.userId || !session.address) {
    return NextResponse.json(err(API_ERROR_CODES.UNAUTHORIZED, "Wallet sign-in required"), {
      status: 401,
    });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(err(API_ERROR_CODES.VALIDATION, "Invalid JSON"), { status: 400 });
  }

  const parsed = createBodySchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      err(API_ERROR_CODES.VALIDATION, first?.message ?? "Invalid submission"),
      { status: 400 },
    );
  }

  try {
    const question = parsed.data.question.trim();
    if (!question.endsWith("?")) {
      return NextResponse.json(
        err(API_ERROR_CODES.VALIDATION, "Question must end with a question mark"),
        { status: 400 },
      );
    }

    const resolvesAt = new Date(parsed.data.resolvesAt);
    const min = Date.now() + 24 * 60 * 60 * 1000;
    if (!Number.isFinite(resolvesAt.getTime()) || resolvesAt.getTime() < min) {
      return NextResponse.json(
        err(
          API_ERROR_CODES.VALIDATION,
          "Resolution date must be at least 24 hours from now",
        ),
        { status: 400 },
      );
    }

    const suggestion = await createCommunitySuggestion({
      userId: session.userId,
      walletAddress: session.address,
      question,
      category: parsed.data.category,
      description: parsed.data.description,
      resolutionSource: parsed.data.resolutionSource,
      narrative: parsed.data.narrative,
      resolvesAt,
    });

    revalidateTag("hub-suggestions");

    return NextResponse.json(ok(suggestion), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(err("SUGGESTION_CREATE_FAILED", message), { status: 500 });
  }
}
