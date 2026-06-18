import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { API_ERROR_CODES } from "../../../_lib/errors";
import { err, ok } from "../../../_lib/response";
import { resolveWalletSessionFromCookies } from "@/server/wallet-auth/resolve-wallet-session";
import { voteOnMarketSuggestion } from "@/server/suggestions/vote-on-suggestion";

const bodySchema = z.object({
  direction: z.enum(["UP", "DOWN"]),
});

type RouteCtx = { params: Promise<{ id: string }> };

/** POST /api/v1/markets/suggestions/:id/vote */
export async function POST(req: Request, ctx: RouteCtx) {
  const session = await resolveWalletSessionFromCookies();
  if (!session?.userId) {
    return NextResponse.json(err(API_ERROR_CODES.UNAUTHORIZED, "Wallet sign-in required"), {
      status: 401,
    });
  }

  const { id } = await ctx.params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(err(API_ERROR_CODES.VALIDATION, "Invalid JSON"), { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(err(API_ERROR_CODES.VALIDATION, "direction must be UP or DOWN"), {
      status: 400,
    });
  }

  try {
    const result = await voteOnMarketSuggestion({
      suggestionId: id,
      userId: session.userId,
      direction: parsed.data.direction,
    });
    revalidateTag("hub-suggestions");
    return NextResponse.json(ok(result), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof Error && e.message === "SUGGESTION_NOT_FOUND") {
      return NextResponse.json(err(API_ERROR_CODES.NOT_FOUND, "Suggestion not found"), {
        status: 404,
      });
    }
    throw e;
  }
}
