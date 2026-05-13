import crypto from "node:crypto";
import { prisma } from "@orakly/database";

const NONCE_TTL_MS = 1000 * 60 * 5;

export async function pruneExpiredWalletNonces(): Promise<void> {
  await prisma.walletAuthNonce.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}

/**
 * Mint a one-time nonce bound to the wallet address (normalized lowercase checksummed pair verification at consume).
 */
export async function createWalletAuthNonce(addressNorm: string): Promise<{
  nonce: string;
  expiresAt: Date;
}> {
  await pruneExpiredWalletNonces();

  const nonce = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + NONCE_TTL_MS);

  await prisma.walletAuthNonce.create({
    data: {
      nonce,
      addressNorm,
      expiresAt,
    },
  });

  return { nonce, expiresAt };
}
