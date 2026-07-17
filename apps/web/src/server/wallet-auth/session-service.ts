import crypto from "node:crypto";
import { prisma } from "@orakly/database";
import { getAddress, verifyMessage } from "viem";
import { tbnbChain } from "@/features/wallet/config/chains";
import {
  readChainIdFromMessage,
  readNonceFromMessage,
} from "@/features/wallet/lib/auth-message";
import {
  signWalletSessionToken,
  type WalletSessionClaims,
} from "@/features/wallet/server/wallet-session";
import { toDec } from "@/server/trading/constants";
import { WalletAuthHttpError } from "./wallet-auth-errors";

const DEFAULT_STARTER_BALANCE_USD = 10_000;

function starterBalance() {
  const raw = process.env.TRADING_STARTER_BALANCE_USD?.trim();
  const n = raw ? Number(raw) : DEFAULT_STARTER_BALANCE_USD;
  return toDec(Number.isFinite(n) && n > 0 ? n : DEFAULT_STARTER_BALANCE_USD);
}

export const WALLET_AUTH_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export const WALLET_AUTH_SESSION_MAX_AGE_SEC = Math.floor(
  WALLET_AUTH_SESSION_TTL_MS / 1000,
);

export type WalletVerifyBody = {
  message: string;
  signature: `0x${string}`;
  address: string;
  chainId?: number;
};

export async function completeWalletAuthentication(
  body: WalletVerifyBody,
): Promise<{ claims: WalletSessionClaims; token: string; userId: string | null }> {
  const messageNonce = readNonceFromMessage(body.message);
  if (!messageNonce) {
    throw new WalletAuthHttpError("NONCE", "Message missing nonce", 400);
  }

  const messageChainId = readChainIdFromMessage(body.message);
  if (messageChainId !== tbnbChain.id) {
    throw new WalletAuthHttpError("CHAIN", "Message chain mismatch", 400);
  }

  const claimedChain = body.chainId ?? messageChainId;
  if (claimedChain !== tbnbChain.id) {
    throw new WalletAuthHttpError("CHAIN", "Wallet chain mismatch", 400);
  }

  let address: `0x${string}`;
  try {
    address = getAddress(body.address);
  } catch {
    throw new WalletAuthHttpError("ADDRESS", "Invalid address", 400);
  }

  const addressNorm = address.toLowerCase();

  const signatureOk = await verifyMessage({
    address,
    message: body.message,
    signature: body.signature,
  });

  if (!signatureOk) {
    throw new WalletAuthHttpError("SIGNATURE", "Invalid signature", 401);
  }

  const jti = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + WALLET_AUTH_SESSION_TTL_MS);
  let resolvedUserId: string | null = null;

  await prisma.$transaction(async (tx) => {
    const nonceRow = await tx.walletAuthNonce.findFirst({
      where: {
        nonce: messageNonce,
        addressNorm,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!nonceRow) {
      throw new WalletAuthHttpError(
        "NONCE",
        "Invalid or expired nonce. Request a new one",
        400,
      );
    }

    await tx.walletAuthNonce.update({
      where: { id: nonceRow.id },
      data: { consumedAt: new Date() },
    });

    await tx.walletAuthSession.updateMany({
      where: {
        walletAddress: addressNorm,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    const resolvedUser = await tx.user.upsert({
      where: { walletAddress: addressNorm },
      create: { walletAddress: addressNorm },
      update: {},
      select: { id: true },
    });
    resolvedUserId = resolvedUser.id;

    await tx.wallet.upsert({
      where: { userId: resolvedUserId },
      create: {
        userId: resolvedUserId,
        availableBalance: starterBalance(),
        lockedBalance: toDec(0),
      },
      update: {},
    });

    await tx.portfolio.upsert({
      where: { userId: resolvedUserId },
      create: { userId: resolvedUserId },
      update: {},
    });

    await tx.walletAuthSession.create({
      data: {
        jti,
        walletAddress: addressNorm,
        expiresAt,
        userId: resolvedUserId,
      },
    });
  });

  const claims: WalletSessionClaims = {
    address,
    chainId: tbnbChain.id,
    jti,
  };

  const token = signWalletSessionToken(claims, WALLET_AUTH_SESSION_MAX_AGE_SEC);

  return { claims, token, userId: resolvedUserId };
}

export async function revokeWalletSessionsByJti(jti: string): Promise<void> {
  await prisma.walletAuthSession.updateMany({
    where: { jti, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
