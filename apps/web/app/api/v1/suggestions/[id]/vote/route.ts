import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { API_ERROR_CODES } from "../../../_lib/errors";
import { err, ok } from "../../../_lib/response";
import { resolveWalletSessionFromCookies } from "@/server/wallet-auth/resolve-wallet-session";
import { toggleSuggestionVote } from "@/server/suggestions/community-suggestions";

type RouteCtx = { params: Promise<{ id: string }> };

/** POST /api/v1/suggestions/:id/vote — toggle wallet vote on a suggestion. */
export async function POST(_req: Request, ctx: RouteCtx) {
  const session = await resolveWalletSessionFromCookies();
  if (!session?.address) {
    return NextResponse.json(err(API_ERROR_CODES.UNAUTHORIZED, "Wallet sign-in required"), {
      status: 401,
    });
  }

  const { id } = await ctx.params;

  try {
    const result = await toggleSuggestionVote(id, session.address);
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
