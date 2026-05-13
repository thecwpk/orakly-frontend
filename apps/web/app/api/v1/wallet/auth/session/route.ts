import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { err, ok } from "../../../_lib/response";
import { revokeWalletSessionsByJti } from "@/server/wallet-auth/session-service";
import { resolveWalletSessionFromCookies } from "@/server/wallet-auth/resolve-wallet-session";
import {
  tryVerifyWalletSessionToken,
  WALLET_SESSION_COOKIE,
} from "@/features/wallet/server/wallet-session";

/** Session introspection — JWT **and** active Postgres row. */
export async function GET() {
  const session = await resolveWalletSessionFromCookies();
  if (!session) {
    return NextResponse.json(err("UNAUTHORIZED", "No valid wallet session"), {
      status: 401,
    });
  }

  return NextResponse.json(
    ok({
      address: session.address,
      chainId: session.chainId,
      userId: session.userId,
    }),
  );
}

/** Revokes server session (`jti`) and clears cookie (logout). */
export async function DELETE() {
  const jar = await cookies();
  const token = jar.get(WALLET_SESSION_COOKIE)?.value;
  const claims = tryVerifyWalletSessionToken(token);

  const res = NextResponse.json(ok({ signedOut: true }));
  res.cookies.delete(WALLET_SESSION_COOKIE);

  if (claims?.jti) {
    await revokeWalletSessionsByJti(claims.jti);
  }

  return res;
}
