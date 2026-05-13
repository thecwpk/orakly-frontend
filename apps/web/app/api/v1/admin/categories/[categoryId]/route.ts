import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@orakly/database";
import { requireAdminPermission } from "@/server/admin/admin-session";
import { writeAdminAudit } from "@/server/admin/audit";
import { ok } from "../../../_lib/response";
import { adminJsonError } from "../../_lib/admin-http";

const patchSchema = z.object({
  name: z.string().min(2).max(160).optional(),
  slug: z.string().min(2).max(96).optional(),
  parentId: z.string().uuid().optional().nullable(),
});

type RouteCtx = { params: Promise<{ categoryId: string }> };

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  try {
    const actor = await requireAdminPermission(req, "categories.manage");
    const { categoryId } = await ctx.params;
    const json = await req.json();
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION", message: parsed.error.message } },
        { status: 400 },
      );
    }

    let slug = parsed.data.slug;
    if (slug) {
      slug = slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    const row = await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name.trim() } : {}),
        ...(slug ? { slug } : {}),
        ...(parsed.data.parentId !== undefined ?
          { parentId: parsed.data.parentId }
        : {}),
      },
    });

    await writeAdminAudit({
      ctx: actor,
      action: "category.update",
      targetType: "Category",
      targetId: categoryId,
      metadata: parsed.data,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    return NextResponse.json(ok(row));
  } catch (e) {
    return adminJsonError(e);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  try {
    const actor = await requireAdminPermission(req, "categories.manage");
    const { categoryId } = await ctx.params;

    await prisma.category.delete({ where: { id: categoryId } });

    await writeAdminAudit({
      ctx: actor,
      action: "category.delete",
      targetType: "Category",
      targetId: categoryId,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    return NextResponse.json(ok({ deleted: true }));
  } catch (e) {
    return adminJsonError(e);
  }
}
