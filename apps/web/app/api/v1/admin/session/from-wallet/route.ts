import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { tryAttachAdminSessionForUser } from "@/server/admin/admin-session";
import { resolveWalletSessionFromCookies } from "@/server/wallet-auth/resolve-wallet-session";
import { ok } from "../../../_lib/response";
import { adminJsonError } from "../../_lib/admin-http";

/**
 * Mint operator cookie from an existing SIWE wallet session (ADMIN / MODERATOR).
 */
export async function POST() {
  try {
    const wallet = await resolveWalletSessionFromCookies();
    if (!wallet?.userId) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Wallet session required" } },
        { status: 401 },
      );
    }

    if (wallet.role !== UserRole.ADMIN && wallet.role !== UserRole.MODERATOR) {
      return NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "Wallet is not an operator account" } },
        { status: 403 },
      );
    }

    const res = NextResponse.json(ok({ bootstrapped: true }));
    const attached = await tryAttachAdminSessionForUser(res, wallet.userId);
    if (!attached) {
      return NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "Could not establish operator session" } },
        { status: 403 },
      );
    }

    return res;
  } catch (e) {
    return adminJsonError(e);
  }
}
