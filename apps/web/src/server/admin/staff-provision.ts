import { prisma } from "@orakly/database";
import { UserRole } from "@prisma/client";
import { AdminAuthError } from "./admin-session";

export async function ensureStaffAdminRecord(userId: string): Promise<{
  id: string;
  canResolveMarkets: boolean;
  canAdjustWallets: boolean;
  canManageUsers: boolean;
}> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR)) {
    throw new AdminAuthError("FORBIDDEN", "User is not eligible for operator access", 403);
  }

  const defaults =
    user.role === UserRole.ADMIN ?
      {
        canResolveMarkets: true,
        canAdjustWallets: true,
        canManageUsers: true,
      }
    : {
        canResolveMarkets: true,
        canAdjustWallets: false,
        canManageUsers: false,
      };

  return prisma.admin.upsert({
    where: { userId },
    create: {
      userId,
      ...defaults,
    },
    update: {},
    select: {
      id: true,
      canResolveMarkets: true,
      canAdjustWallets: true,
      canManageUsers: true,
    },
  });
}
