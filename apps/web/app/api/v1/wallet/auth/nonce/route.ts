import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAddress } from "viem";
import { z } from "zod";
import { err, ok } from "../../../_lib/response";
import { createWalletAuthNonce } from "@/server/wallet-auth/nonce-service";

const bodySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/u),
});

/**
 * Issue a **single-use** nonce bound to the connecting wallet (replay protection via Postgres row).
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

    let addressNorm: string;
    try {
      addressNorm = getAddress(parsed.data.address).toLowerCase();
    } catch {
      return NextResponse.json(err("ADDRESS", "Invalid address"), {
        status: 400,
      });
    }

    const { nonce, expiresAt } = await createWalletAuthNonce(addressNorm);

    return NextResponse.json(
      ok({
        nonce,
        expiresAt: expiresAt.toISOString(),
      }),
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "NONCE_FAILED";
    return NextResponse.json(err("INTERNAL", msg), { status: 500 });
  }
}
