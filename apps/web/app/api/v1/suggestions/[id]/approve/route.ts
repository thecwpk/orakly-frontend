import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { API_ERROR_CODES } from "../../../_lib/errors";
import { ok } from "../../../_lib/response";
import { requireAdminPermission } from "@/server/admin/admin-session";
import { adminJsonError } from "../../../admin/_lib/admin-http";
import { triggerMetricsRefresh } from "@/server/analytics/trigger-refresh";
import { approveCommunitySuggestion } from "@/server/suggestions/community-suggestions";

const bodySchema = z.object({
  creatorRewardPercent: z.number().min(0).max(100).optional(),
});

type RouteCtx = { params: Promise<{ id: string }> };

/** POST /api/v1/suggestions/:id/approve — promote suggestion to live market (admin). */
export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    await requireAdminPermission(req, "markets.write");

    const { id } = await ctx.params;

    let creatorRewardPercent: number | undefined;
    try {
      const json = await req.json();
      const parsed = bodySchema.safeParse(json);
      if (parsed.success) {
        creatorRewardPercent = parsed.data.creatorRewardPercent;
      }
    } catch {
      // empty body is allowed — use PlatformConfig default
    }

    const market = await approveCommunitySuggestion(id, creatorRewardPercent);

    void triggerMetricsRefresh({
      marketId: market.id,
      narrativeSlug: market.narrative ?? undefined,
      event: "create",
    });

    revalidateTag("hub-suggestions");
    revalidateTag("markets-feed");

    return NextResponse.json(ok(market), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof Error && e.message === "SUGGESTION_NOT_FOUND") {
      return NextResponse.json(
        { ok: false, error: { code: API_ERROR_CODES.NOT_FOUND, message: "Suggestion not found" } },
        { status: 404 },
      );
    }
    if (e instanceof Error && e.message === "SUGGESTION_REJECTED") {
      return NextResponse.json(
        { ok: false, error: { code: API_ERROR_CODES.VALIDATION, message: "Suggestion was rejected" } },
        { status: 400 },
      );
    }
    return adminJsonError(e);
  }
}
