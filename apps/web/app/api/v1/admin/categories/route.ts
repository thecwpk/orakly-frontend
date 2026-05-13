import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@orakly/database";
import { requireAdminPermission } from "@/server/admin/admin-session";
import { writeAdminAudit } from "@/server/admin/audit";
import { ok } from "../../_lib/response";
import { adminJsonError } from "../_lib/admin-http";

const createSchema = z.object({
  slug: z.string().min(2).max(96),
  name: z.string().min(2).max(160),
  parentId: z.string().uuid().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdminPermission(req, "analytics.read");
    const rows = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        parentId: true,
        _count: { select: { markets: true } },
      },
    });
    return NextResponse.json(ok(rows));
  } catch (e) {
    return adminJsonError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAdminPermission(req, "categories.manage");
    const json = await req.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION", message: parsed.error.message } },
        { status: 400 },
      );
    }

    const slug = parsed.data.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const row = await prisma.category.create({
      data: {
        slug,
        name: parsed.data.name.trim(),
        parentId: parsed.data.parentId ?? null,
      },
    });

    await writeAdminAudit({
      ctx,
      action: "category.create",
      targetType: "Category",
      targetId: row.id,
      metadata: { slug: row.slug },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    return NextResponse.json(ok(row));
  } catch (e) {
    return adminJsonError(e);
  }
}
