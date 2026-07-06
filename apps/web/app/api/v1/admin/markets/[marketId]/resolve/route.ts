import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { resolveMarket } from "@/server/trading/settlement.service";
import { requireTradingUserId } from "@/server/trading/auth-context";
import { TradingError } from "@/server/trading/errors";
import { requireAdminPermission } from "@/server/admin/admin-session";
import { writeAdminAudit } from "@/server/admin/audit";
import { ok } from "../../../../_lib/response";
import { adminJsonError } from "../../../_lib/admin-http";
import { triggerMetricsRefresh } from "@/server/analytics/trigger-refresh";
import { prisma } from "@orakly/database";

const bodySchema = z.object({
  outcome: z.enum(["YES", "NO"]),
});

type RouteCtx = { params: Promise<{ marketId: string }> };

export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    const actor = await requireAdminPermission(req, "markets.resolve");
    const { marketId } = await ctx.params;
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION", message: parsed.error.message } },
        { status: 400 },
      );
    }

    let resolvedByUserId: string | null = actor.userId;
    try {
      resolvedByUserId = await requireTradingUserId(req);
    } catch (e) {
      if (e instanceof TradingError && e.httpStatus === 401) {
        resolvedByUserId = actor.userId;
      } else {
        throw e;
      }
    }

    const snapshot = await resolveMarket({
      marketId,
      outcome: parsed.data.outcome,
      resolvedByUserId,
    });

    await writeAdminAudit({
      ctx: actor,
      action: "market.resolve",
      targetType: "Market",
      targetId: marketId,
      metadata: { outcome: parsed.data.outcome },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    revalidateTag("markets-feed");

    void prisma.market
      .findUnique({
        where: { id: marketId },
        select: { narrative: true },
      })
      .then((market) => {
        void triggerMetricsRefresh({
          marketId,
          narrativeSlug: market?.narrative ?? undefined,
          event: "resolve",
        });
      });

    return NextResponse.json(ok(snapshot));
  } catch (e) {
    return adminJsonError(e);
  }
}
