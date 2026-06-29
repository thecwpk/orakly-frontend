import { prisma } from "@orakly/database";
import { TradingError } from "./errors";
import { toDec } from "./constants";

const PLATFORM_WALLET_ADDRESS = "0x00000000000000000000000000000000ca11ab1e";

/** Custodial account that warehouses passive liquidity + receives platform fees. */
export async function ensurePlatformLiquidityUserId(): Promise<string> {
  const fromEnv = process.env.PLATFORM_LIQUIDITY_USER_ID?.trim();
  if (fromEnv) return fromEnv;

  const walletAddress = PLATFORM_WALLET_ADDRESS.toLowerCase();
  const user = await prisma.user.upsert({
    where: { walletAddress },
    create: {
      walletAddress,
      displayName: "Orakly Liquidity",
      role: "USER",
    },
    update: {},
    select: { id: true },
  });

  const wallet = await prisma.wallet.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      availableBalance: toDec(50_000_000),
      lockedBalance: toDec(0),
    },
    update: {},
    select: { availableBalance: true },
  });

  if (wallet.availableBalance.lessThan(toDec(1_000_000))) {
    await prisma.wallet.update({
      where: { userId: user.id },
      data: { availableBalance: toDec(50_000_000) },
    });
  }

  await prisma.portfolio.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });

  return user.id;
}

/** @deprecated Prefer ensurePlatformLiquidityUserId — kept for sync call sites during migration. */
export function requirePlatformLiquidityUserId(): string {
  const id = process.env.PLATFORM_LIQUIDITY_USER_ID?.trim();
  if (!id) {
    throw new TradingError(
      "CONFIG",
      "Platform liquidity is initializing — retry in a moment",
      503,
    );
  }
  return id;
}
