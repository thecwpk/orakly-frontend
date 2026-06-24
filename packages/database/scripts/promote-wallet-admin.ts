/**
 * One-off: promote a wallet address to platform ADMIN.
 * Usage: WALLET_ADDRESS=0x... npx tsx scripts/promote-wallet-admin.ts
 */
import "dotenv/config";
import { UserRole } from "@prisma/client";
import { prisma } from "../src/client.ts";

const raw = process.env.WALLET_ADDRESS?.trim().toLowerCase();
if (!raw || !/^0x[a-f0-9]{40}$/.test(raw)) {
  console.error("Set WALLET_ADDRESS=0x... (checksummed or lowercase)");
  process.exit(1);
}

const user = await prisma.user.upsert({
  where: { walletAddress: raw },
  create: {
    walletAddress: raw,
    role: UserRole.ADMIN,
    displayName: "Platform Admin",
  },
  update: {
    role: UserRole.ADMIN,
    isSuspended: false,
  },
});

const admin = await prisma.admin.upsert({
  where: { userId: user.id },
  create: {
    userId: user.id,
    canResolveMarkets: true,
    canAdjustWallets: true,
    canManageUsers: true,
  },
  update: {
    canResolveMarkets: true,
    canAdjustWallets: true,
    canManageUsers: true,
  },
});

console.log(
  JSON.stringify(
    {
      userId: user.id,
      walletAddress: user.walletAddress,
      role: user.role,
      adminId: admin.id,
    },
    null,
    2,
  ),
);

await prisma.$disconnect();
