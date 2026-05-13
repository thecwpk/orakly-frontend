import { prisma } from "@orakly/database";
import type { AdminActorContext } from "./admin-session";

export async function writeAdminAudit(input: {
  ctx: AdminActorContext;
  action: string;
  targetType: string;
  targetId?: string | null;
  targetUserId?: string | null;
  metadata?: unknown;
  ip?: string | null;
}) {
  await prisma.adminAuditLog.create({
    data: {
      adminId: input.ctx.adminId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? undefined,
      targetUserId: input.targetUserId ?? undefined,
      metadata:
        input.metadata === undefined ? undefined : (input.metadata as object),
      ipAddress: input.ip ?? undefined,
    },
  });
}
