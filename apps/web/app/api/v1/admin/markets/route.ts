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
import { readDefaultCreatorRewardPercent } from "@/server/suggestions/community-suggestions";
import { writeAdminAudit } from "@/server/admin/audit";
import { ok } from "../../_lib/response";
import { adminJsonError } from "../_lib/admin-http";
import { triggerMetricsRefresh } from "@/server/analytics/trigger-refresh";

const ADMIN_CATEGORY_KEYS = ["meme", "defi", "layer1", "layer2", "ai", "other"] as const;

const createSchema = z.object({
  title: z.string().min(10).max(512),
  slug: z.string().min(2).max(180).optional(),
  description: z.string().max(8000).optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  adminCategory: z.enum(ADMIN_CATEGORY_KEYS).optional().nullable(),
  narrative: z.string().min(2).max(64).optional().nullable(),
  resolutionSource: z.string().min(2).max(512).optional().nullable(),
  creatorRewardPercent: z.number().min(0).max(20).optional(),
  minimumBetBnb: z.number().min(0.001).max(100).optional(),
  opensAt: z.string().datetime().optional().nullable(),
  closesAt: z.string().datetime(),
  takerFeeBps: z.number().int().min(0).max(500).optional(),
  liquidityUsd: z.number().min(100).max(10_000_000).optional(),
  initialProbability: z.number().min(0.01).max(0.99).optional(),
  status: z.nativeEnum(MarketStatus).optional(),
  onChainAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional().nullable(),
  chainId: z.number().int().positive().optional().nullable(),
});

function slugifyTitle(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminPermission(req, "analytics.read");
    const { searchParams } = new URL(req.url);
    const take = Math.min(Number(searchParams.get("take") ?? 40), 120);
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
        narrative: true,
        resolutionSource: true,
        creatorRewardPercent: true,
        generationMeta: true,
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

    const slug = parsed.data.slug?.trim() || slugifyTitle(parsed.data.title);
    if (!slug) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION", message: "Could not derive slug from title" } },
        { status: 400 },
      );
    }

    const defaultReward = await readDefaultCreatorRewardPercent();

    const market = await adminCreateMarket({
      title: parsed.data.title,
      slug,
      description: parsed.data.description ?? null,
      categoryId: parsed.data.categoryId ?? null,
      adminCategory: parsed.data.adminCategory ?? null,
      narrative: parsed.data.narrative ?? null,
      resolutionSource: parsed.data.resolutionSource ?? null,
      creatorRewardPercent: parsed.data.creatorRewardPercent ?? defaultReward,
      minimumBetBnb: parsed.data.minimumBetBnb ?? 0.01,
      creatorId: ctx.userId,
      opensAt: parsed.data.opensAt ? new Date(parsed.data.opensAt) : null,
      closesAt: new Date(parsed.data.closesAt),
      takerFeeBps: parsed.data.takerFeeBps,
      liquidityUsd: parsed.data.liquidityUsd,
      initialProbability: parsed.data.initialProbability,
      status: parsed.data.onChainAddress ? parsed.data.status : MarketStatus.DRAFT,
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

    void triggerMetricsRefresh({
      marketId: market.id,
      narrativeSlug: parsed.data.narrative ?? undefined,
      event: "create",
    });

    return NextResponse.json(ok(market));
  } catch (e) {
    return adminJsonError(e);
  }
}
