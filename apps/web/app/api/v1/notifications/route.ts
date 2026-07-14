import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { err, ok } from "../_lib/response";
import { listWalletNotifications } from "@/server/queries/wallet-notifications";

/** GET /api/v1/notifications?walletAddress=&limit=20 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const walletAddress = sp.get("walletAddress")?.trim() ?? "";
  const limitRaw = Number.parseInt(sp.get("limit") ?? "20", 10);
  const limit = Number.isFinite(limitRaw) ? limitRaw : 20;

  if (!walletAddress) {
    return NextResponse.json(
      err("VALIDATION", "walletAddress is required"),
      { status: 400 },
    );
  }

  try {
    const data = await listWalletNotifications({ walletAddress, limit });
    return NextResponse.json(ok(data), {
      headers: {
        "Cache-Control": "private, max-age=5, stale-while-revalidate=15",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(err("NOTIFICATIONS_UNAVAILABLE", message), {
      status: 503,
    });
  }
}
