import { NextResponse } from "next/server";
import { ok, err } from "../../_lib/response";
import { getAttentionDashboardRows } from "@/server/queries/attention-dashboard";

/** GET /api/v1/dashboard/attention — narrative attention scores for hub. */
export async function GET() {
  try {
    const data = await getAttentionDashboardRows();
    return NextResponse.json(ok(data), {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(err("ATTENTION_UNAVAILABLE", message), { status: 503 });
  }
}
