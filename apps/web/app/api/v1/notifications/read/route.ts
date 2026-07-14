import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { err, ok } from "../../_lib/response";
import { markNotificationsRead } from "@/server/queries/wallet-notifications";

type Body = {
  walletAddress?: string;
  ids?: string[];
  markAll?: boolean;
};

/** POST /api/v1/notifications/read — mark notification activity rows as read. */
export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(err("VALIDATION", "Invalid JSON body"), {
      status: 400,
    });
  }

  const walletAddress = body.walletAddress?.trim() ?? "";
  if (!walletAddress) {
    return NextResponse.json(
      err("VALIDATION", "walletAddress is required"),
      { status: 400 },
    );
  }

  const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
  const markAll = body.markAll === true;
  if (!markAll && ids.length === 0) {
    return NextResponse.json(
      err("VALIDATION", "ids or markAll required"),
      { status: 400 },
    );
  }

  try {
    const data = await markNotificationsRead({
      walletAddress,
      ids,
      markAll,
    });
    return NextResponse.json(ok(data));
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(err("NOTIFICATIONS_READ_FAILED", message), {
      status: 503,
    });
  }
}
