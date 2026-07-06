import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminRole } from "@/server/admin/admin-session";
import { writeAdminAudit } from "@/server/admin/audit";
import {
  getJobSchedulesFromEnv,
  getPlatformConfigMap,
  upsertPlatformConfigs,
} from "@/server/admin/platform-config.service";
import { adminJsonError } from "../../v1/admin/_lib/admin-http";
import { err, ok } from "../../v1/_lib/response";

const putSchema = z.object({
  configs: z
    .array(
      z.object({
        key: z.string().min(1).max(128),
        value: z.string().max(64),
      }),
    )
    .min(1),
});

/** GET /api/admin/config — platform metric weights (ADMIN only). */
export async function GET(req: NextRequest) {
  try {
    await requireAdminRole(req);
    const configs = await getPlatformConfigMap();
    return NextResponse.json({
      ...ok(configs),
      jobSchedules: getJobSchedulesFromEnv(),
    });
  } catch (e) {
    return adminJsonError(e);
  }
}

/** PUT /api/admin/config — upsert platform config rows (ADMIN only). */
export async function PUT(req: NextRequest) {
  try {
    const ctx = await requireAdminRole(req);
    const json = await req.json();
    const parsed = putSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        err("VALIDATION", parsed.error.message),
        { status: 400 },
      );
    }

    const configs = await upsertPlatformConfigs(
      parsed.data.configs,
      ctx.userId,
    );

    await writeAdminAudit({
      ctx,
      action: "platform_config.update",
      targetType: "PlatformConfig",
      metadata: {
        keys: parsed.data.configs.map((c) => c.key),
      },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    return NextResponse.json(ok(configs));
  } catch (e) {
    return adminJsonError(e);
  }
}
