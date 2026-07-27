import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { MarketStatus } from "@prisma/client";
import { requireAdminPermission } from "@/server/admin/admin-session";
import {
  adminDeleteMarket,
  adminModerateMarket,
} from "@/server/admin/market-admin.service";
import { writeAdminAudit } from "@/server/admin/audit";
import { ok } from "../../../_lib/response";
import { adminJsonError } from "../../_lib/admin-http";

const patchSchema = z.object({
  title: z.string().min(4).max(512).optional(),
  description: z.string().max(8000).optional().nullable(),
  status: z.nativeEnum(MarketStatus).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  onChainAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional().nullable(),
  chainId: z.number().int().positive().optional().nullable(),
  closesAt: z.string().datetime().optional(),
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

    const { closesAt: closesAtRaw, ...rest } = parsed.data;
    const closesAt = closesAtRaw ? new Date(closesAtRaw) : undefined;
    if (closesAt && Number.isNaN(closesAt.getTime())) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION", message: "Invalid closesAt" } },
        { status: 400 },
      );
    }
    if (closesAt && closesAt.getTime() <= Date.now()) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "VALIDATION", message: "closesAt must be in the future" },
        },
        { status: 400 },
      );
    }

    const market = await adminModerateMarket({
      marketId,
      ...rest,
      ...(closesAt ? { closesAt } : {}),
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

/** DELETE /api/v1/admin/markets/:marketId — remove market from DB (and related trade rows). */
export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  try {
    const ctxActor = await requireAdminPermission(req, "markets.moderate");
    const { marketId } = await ctx.params;
    const deleted = await adminDeleteMarket(marketId);

    await writeAdminAudit({
      ctx: ctxActor,
      action: "market.delete",
      targetType: "Market",
      targetId: marketId,
      metadata: { title: deleted.title },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    revalidateTag("markets-feed");

    return NextResponse.json(ok(deleted));
  } catch (e) {
    return adminJsonError(e);
  }
}
