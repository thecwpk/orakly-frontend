import jwt from "jsonwebtoken";
import { getAddress } from "viem";
import type { Address } from "viem";

export const WALLET_SESSION_COOKIE = "orakly_wallet_session";

export type WalletSessionClaims = {
  /** Checksummed address */
  address: Address;
  chainId: number;
  /** JWT ID persisted in Postgres for revocation & session fixation resistance */
  jti: string;
};

type JwtPayload = {
  sub: string;
  cid: number;
  jti: string;
};

function sessionSecret(): string {
  const direct = process.env.WALLET_SESSION_SECRET?.trim();
  const fallback = process.env.ADMIN_SESSION_SECRET?.trim();
  const s = direct ?? fallback;
  if (!s || s.length < 16) {
    throw new Error(
      "WALLET_SESSION_SECRET (16+ chars) or ADMIN_SESSION_SECRET must be configured",
    );
  }
  return s;
}

export function signWalletSessionToken(
  claims: WalletSessionClaims,
  expiresInSec = 60 * 60 * 24 * 7,
): string {
  const payload: JwtPayload = {
    sub: claims.address.toLowerCase(),
    cid: claims.chainId,
    jti: claims.jti,
  };
  return jwt.sign(payload, sessionSecret(), {
    algorithm: "HS256",
    expiresIn: expiresInSec,
  });
}

export function verifyWalletSessionToken(token: string): WalletSessionClaims {
  const decoded = jwt.verify(token, sessionSecret(), {
    algorithms: ["HS256"],
  });
  if (typeof decoded !== "object" || decoded === null) {
    throw new Error("INVALID_SESSION");
  }
  const sub = (decoded as jwt.JwtPayload).sub;
  const cid = (decoded as jwt.JwtPayload).cid;
  const jti = (decoded as jwt.JwtPayload).jti;
  if (
    typeof sub !== "string" ||
    typeof cid !== "number" ||
    typeof jti !== "string" ||
    !jti
  ) {
    throw new Error("INVALID_SESSION_CLAIMS");
  }
  return {
    address: getAddress(sub) as Address,
    chainId: cid,
    jti,
  };
}

export function tryVerifyWalletSessionToken(
  token: string | undefined,
): WalletSessionClaims | null {
  if (!token) return null;
  try {
    return verifyWalletSessionToken(token);
  } catch {
    return null;
  }
}
