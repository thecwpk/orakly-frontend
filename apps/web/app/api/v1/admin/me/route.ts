import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resolveAdminActor } from "@/server/admin/admin-session";
import { ok } from "../../_lib/response";
import { adminJsonError } from "../_lib/admin-http";

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveAdminActor(req);
    return NextResponse.json(
      ok({
        userId: ctx.userId,
        adminId: ctx.adminId,
        role: ctx.role,
        email: ctx.email,
        displayName: ctx.displayName,
        permissions: [...ctx.permissions],
      }),
    );
  } catch (e) {
    return adminJsonError(e);
  }
}
