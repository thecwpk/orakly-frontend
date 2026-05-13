import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@orakly/database";
import { requireAdminPermission } from "@/server/admin/admin-session";
import { ok } from "../../../_lib/response";
import { adminJsonError } from "../../_lib/admin-http";

export async function GET(req: NextRequest) {
  try {
    await requireAdminPermission(req, "analytics.read");
    const { searchParams } = new URL(req.url);
    const days = Math.min(Number(searchParams.get("days") ?? 30), 366);
    const to = new Date();
    const from = new Date(to.getTime() - days * 864e5);

    const rows = await prisma.$queryRaw<{ day: Date; total: Prisma.Decimal }[]>`
      SELECT date_trunc('day', "createdAt") AS day,
             COALESCE(SUM("amountUsd"), 0) AS total
      FROM "PlatformFee"
      WHERE "createdAt" >= ${from}
        AND "createdAt" <= ${to}
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    const series = rows.map((r) => ({
      day: r.day.toISOString().slice(0, 10),
      feesUsd: r.total.toFixed(),
    }));

    return NextResponse.json(ok({ from: from.toISOString(), to: to.toISOString(), series }));
  } catch (e) {
    return adminJsonError(e);
  }
}
