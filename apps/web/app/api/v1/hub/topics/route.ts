import { NextResponse } from "next/server";
import { ok, err } from "../../_lib/response";
import { getHubTopicChips } from "@/server/queries/hub-topics";

/** GET /api/v1/hub/topics — dynamic narrative + breaking chips for hub bar. */
export async function GET() {
  try {
    const data = await getHubTopicChips();
    return NextResponse.json(ok(data), {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(err("HUB_TOPICS_UNAVAILABLE", message), { status: 503 });
  }
}
