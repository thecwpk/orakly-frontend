import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { MarketStatus } from "@prisma/client";
import { requireAdminPermission } from "@/server/admin/admin-session";
import { adminModerateMarket } from "@/server/admin/market-admin.service";
import { writeAdminAudit } from "@/server/admin/audit";
import { ok } from "../../../_lib/response";
import { adminJsonError } from "../../_lib/admin-http";

const patchSchema = z.object({
  title: z.string().min(4).max(512).optional(),
  description: z.string().max(8000).optional().nullable(),
  status: z.nativeEnum(MarketStatus).optional(),
  categoryId: z.string().uuid().optional().nullable(),
});

type RouteCtx = { params: Promise<{ marketId: string }> };

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  try {
    const ctxActor = await requireAdminPermission(req, "markets.moderate");
    const { marketId } = await ctx.params;
    const json = await req.json();
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION", message: parsed.error.message } },
        { status: 400 },
      );
    }

    const market = await adminModerateMarket({
      marketId,
      ...parsed.data,
    });

    await writeAdminAudit({
      ctx: ctxActor,
      action: "market.moderate",
      targetType: "Market",
      targetId: marketId,
      metadata: parsed.data,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    revalidateTag("markets-feed");

    return NextResponse.json(ok(market));
  } catch (e) {
    return adminJsonError(e);
  }
}
