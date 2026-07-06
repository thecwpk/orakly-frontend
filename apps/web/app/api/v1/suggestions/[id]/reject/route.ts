import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { API_ERROR_CODES } from "../../../_lib/errors";
import { ok } from "../../../_lib/response";
import { requireAdminPermission } from "@/server/admin/admin-session";
import { adminJsonError } from "../../../admin/_lib/admin-http";
import { rejectCommunitySuggestion } from "@/server/suggestions/community-suggestions";

const bodySchema = z.object({
  reason: z.string().trim().max(2000).optional(),
});

type RouteCtx = { params: Promise<{ id: string }> };

/** POST /api/v1/suggestions/:id/reject — reject a community suggestion (admin). */
export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    await requireAdminPermission(req, "markets.moderate");

    const { id } = await ctx.params;

    let reason: string | undefined;
    try {
      const json = await req.json();
      const parsed = bodySchema.safeParse(json);
      if (parsed.success) {
        reason = parsed.data.reason;
      }
    } catch {
      // empty body allowed
    }

    const suggestion = await rejectCommunitySuggestion(id, reason);

    revalidateTag("hub-suggestions");

    return NextResponse.json(ok(suggestion), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof Error && e.message === "SUGGESTION_NOT_FOUND") {
      return NextResponse.json(
        { ok: false, error: { code: API_ERROR_CODES.NOT_FOUND, message: "Suggestion not found" } },
        { status: 404 },
      );
    }
    return adminJsonError(e);
  }
}
