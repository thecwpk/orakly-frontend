import { cookies } from "next/headers";
import { prisma } from "@orakly/database";
import type { Address } from "viem";
import {
  tryVerifyWalletSessionToken,
  WALLET_SESSION_COOKIE,
  type WalletSessionClaims,
} from "@/features/wallet/server/wallet-session";

export type ResolvedWalletSession = WalletSessionClaims & {
  /** Platform user linked to this wallet session (custodial trading actor). */
  userId: string | null;
};

/**
 * Validates JWT **and** persistent session row (revocation, fixation, replay of revoked tokens).
 */
export async function resolveWalletSessionFromCookies(): Promise<ResolvedWalletSession | null> {
  const jar = await cookies();
  const token = jar.get(WALLET_SESSION_COOKIE)?.value;

  const jwtClaims = tryVerifyWalletSessionToken(token);
  if (!jwtClaims?.jti) return null;

  const row = await prisma.walletAuthSession.findFirst({
    where: {
      jti: jwtClaims.jti,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      walletAddress: true,
      userId: true,
    },
  });

  if (!row) return null;

  const jwtAddr = jwtClaims.address.toLowerCase();
  if (row.walletAddress.toLowerCase() !== jwtAddr) return null;

  let userId = row.userId;
  if (!userId) {
    const linked = await prisma.user.findFirst({
      where: {
        walletAddress: {
          equals: row.walletAddress.toLowerCase(),
          mode: "insensitive",
        },
      },
      select: { id: true },
    });
    userId = linked?.id ?? null;
  }

  return {
    address: jwtClaims.address as Address,
    chainId: jwtClaims.chainId,
    jti: jwtClaims.jti,
    userId,
  };
}
