import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_SESSION_COOKIE,
  requireBootstrapApiToken,
  signAdminSessionToken,
} from "@/server/admin/admin-session";
import { ensureStaffAdminRecord } from "@/server/admin/staff-provision";
import { prisma } from "@orakly/database";
import { UserRole } from "@prisma/client";
import { ok } from "../../_lib/response";
import { adminJsonError } from "../_lib/admin-http";

const bodySchema = z.object({
  actorUserId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    requireBootstrapApiToken(req);
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION", message: parsed.error.message } },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: parsed.data.actorUserId },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 },
      );
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR) {
      return NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "User lacks operator role" } },
        { status: 403 },
      );
    }

    const admin = await ensureStaffAdminRecord(user.id);
    const token = signAdminSessionToken({
      sub: user.id,
      aid: admin.id,
      role: user.role,
    });

    const res = NextResponse.json(ok({ expiresInSec: 60 * 60 * 8 }));
    res.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return res;
  } catch (e) {
    return adminJsonError(e);
  }
}

export async function DELETE() {
  const res = NextResponse.json(ok({ signedOut: true }));
  res.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return res;
}
