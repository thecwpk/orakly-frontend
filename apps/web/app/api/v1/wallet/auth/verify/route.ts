import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { err, ok } from "../../../_lib/response";
import { tryAttachAdminSessionForUser } from "@/server/admin/admin-session";
import {
  completeWalletAuthentication,
  WALLET_AUTH_SESSION_MAX_AGE_SEC,
} from "@/server/wallet-auth/session-service";
import { WalletAuthHttpError } from "@/server/wallet-auth/wallet-auth-errors";
import { WALLET_SESSION_COOKIE } from "@/features/wallet/server/wallet-session";

const bodySchema = z.object({
  message: z.string().min(32),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/u),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/u),
  chainId: z.number().int().optional(),
});

/**
 * Verify SIWE-style message + EIP-191 signature, consume nonce atomically, rotate sessions, mint JWT cookie.
 */
export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        err("VALIDATION", parsed.error.message),
        { status: 400 },
      );
    }

    const { claims, token, userId } = await completeWalletAuthentication({
      message: parsed.data.message,
      signature: parsed.data.signature as `0x${string}`,
      address: parsed.data.address,
      chainId: parsed.data.chainId,
    });

    const res = NextResponse.json(
      ok({
        address: claims.address,
        chainId: claims.chainId,
        userId,
      }),
    );

    res.cookies.set(WALLET_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: WALLET_AUTH_SESSION_MAX_AGE_SEC,
    });

    await tryAttachAdminSessionForUser(res, userId);

    return res;
  } catch (e) {
    if (e instanceof WalletAuthHttpError) {
      return NextResponse.json(err(e.code, e.message), {
        status: e.httpStatus,
      });
    }
    const msg = e instanceof Error ? e.message : "VERIFY_FAILED";
    return NextResponse.json(err("INTERNAL", msg), { status: 500 });
  }
}
