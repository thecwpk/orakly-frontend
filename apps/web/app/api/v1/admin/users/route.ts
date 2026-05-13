import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@orakly/database";
import { requireAdminPermission } from "@/server/admin/admin-session";
import { ok } from "../../_lib/response";
import { adminJsonError } from "../_lib/admin-http";

export async function GET(req: NextRequest) {
  try {
    await requireAdminPermission(req, "users.manage");
    const { searchParams } = new URL(req.url);
    const take = Math.min(Number(searchParams.get("take") ?? 30), 100);
    const cursor = searchParams.get("cursor");
    const q = searchParams.get("q")?.trim();

    const rows = await prisma.user.findMany({
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      where:
        q ?
          {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { displayName: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isSuspended: true,
        createdAt: true,
        wallet: { select: { availableBalance: true, lockedBalance: true } },
      },
    });

    let nextCursor: string | null = null;
    let page = rows;
    if (rows.length > take) {
      const last = rows.pop()!;
      nextCursor = last.id;
      page = rows;
    }

    return NextResponse.json(ok({ users: page, nextCursor }));
  } catch (e) {
    return adminJsonError(e);
  }
}
