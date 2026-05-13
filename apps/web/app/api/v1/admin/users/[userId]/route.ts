import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@orakly/database";
import { UserRole } from "@prisma/client";
import { requireAdminPermission } from "@/server/admin/admin-session";
import { writeAdminAudit } from "@/server/admin/audit";
import { ok } from "../../../_lib/response";
import { adminJsonError } from "../../_lib/admin-http";

const patchSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  isSuspended: z.boolean().optional(),
  displayName: z.string().min(1).max(120).optional().nullable(),
});

type RouteCtx = { params: Promise<{ userId: string }> };

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  try {
    const actor = await requireAdminPermission(req, "users.manage");
    const { userId } = await ctx.params;
    const json = await req.json();
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION", message: parsed.error.message } },
        { status: 400 },
      );
    }

    if (parsed.data.role === UserRole.ADMIN && actor.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "Only admins may grant ADMIN" } },
        { status: 403 },
      );
    }

    if (userId === actor.userId && parsed.data.isSuspended === true) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION", message: "Cannot suspend your own account" } },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(parsed.data.role !== undefined ? { role: parsed.data.role } : {}),
        ...(parsed.data.isSuspended !== undefined ?
          { isSuspended: parsed.data.isSuspended }
        : {}),
        ...(parsed.data.displayName !== undefined ?
          { displayName: parsed.data.displayName }
        : {}),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isSuspended: true,
      },
    });

    await writeAdminAudit({
      ctx: actor,
      action: "user.update",
      targetType: "User",
      targetId: userId,
      targetUserId: userId,
      metadata: parsed.data,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    return NextResponse.json(ok(user));
  } catch (e) {
    return adminJsonError(e);
  }
}
