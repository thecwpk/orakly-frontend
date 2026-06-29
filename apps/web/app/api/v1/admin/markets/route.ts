import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { MarketStatus } from "@prisma/client";
import { prisma } from "@orakly/database";
import { requireAdminPermission } from "@/server/admin/admin-session";
import {
  adminCreateMarket,
  adminRecordMarketCreatedActivity,
} from "@/server/admin/market-admin.service";
import { writeAdminAudit } from "@/server/admin/audit";
import { ok } from "../../_lib/response";
import { adminJsonError } from "../_lib/admin-http";

const createSchema = z.object({
  title: z.string().min(4).max(512),
  slug: z.string().min(2).max(180),
  description: z.string().max(8000).optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  narrative: z.string().min(2).max(64).optional().nullable(),
  opensAt: z.string().datetime().optional().nullable(),
  closesAt: z.string().datetime(),
  takerFeeBps: z.number().int().min(0).max(500).optional(),
  liquidityUsd: z.number().min(100).max(10_000_000).optional(),
  initialProbability: z.number().min(0.01).max(0.99).optional(),
  status: z.nativeEnum(MarketStatus).optional(),
  onChainAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional().nullable(),
  chainId: z.number().int().positive().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdminPermission(req, "analytics.read");
    const { searchParams } = new URL(req.url);
    const take = Math.min(Number(searchParams.get("take") ?? 40), 100);
    const statusRaw = searchParams.get("status");
    const statusValues = Object.values(MarketStatus) as string[];
    const statusFilter =
      statusRaw && statusRaw !== "ALL" && statusValues.includes(statusRaw) ?
        (statusRaw as MarketStatus)
      : undefined;

    const rows = await prisma.market.findMany({
      where: statusFilter ? { status: statusFilter } : undefined,
      orderBy: { updatedAt: "desc" },
      take,
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        status: true,
        takerFeeBps: true,
        volumeTotalUsd: true,
        liquidityUsd: true,
        closesAt: true,
        createdAt: true,
        onChainAddress: true,
        chainId: true,
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json(ok(rows));
  } catch (e) {
    return adminJsonError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAdminPermission(req, "markets.write");
    const json = await req.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION", message: parsed.error.message } },
        { status: 400 },
      );
    }

    const market = await adminCreateMarket({
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      categoryId: parsed.data.categoryId ?? null,
      narrative: parsed.data.narrative ?? null,
      creatorId: ctx.userId,
      opensAt: parsed.data.opensAt ? new Date(parsed.data.opensAt) : null,
      closesAt: new Date(parsed.data.closesAt),
      takerFeeBps: parsed.data.takerFeeBps,
      liquidityUsd: parsed.data.liquidityUsd,
      initialProbability: parsed.data.initialProbability,
      status: parsed.data.status,
      onChainAddress: parsed.data.onChainAddress ?? null,
      chainId: parsed.data.chainId ?? null,
    });

    await adminRecordMarketCreatedActivity({
      marketId: market.id,
      actorUserId: ctx.userId,
      title: market.title,
    });

    await writeAdminAudit({
      ctx,
      action: "market.create",
      targetType: "Market",
      targetId: market.id,
      metadata: { slug: market.slug },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    revalidateTag("markets-feed");

    return NextResponse.json(ok(market));
  } catch (e) {
    return adminJsonError(e);
  }
}
