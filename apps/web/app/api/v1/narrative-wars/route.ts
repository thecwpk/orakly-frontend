import { NextResponse } from "next/server";
import { ok, err } from "../_lib/response";
import { getNarrativeWars } from "@/server/queries/narrative-wars";

/** GET /api/v1/narrative-wars — head-to-head narrative battle cards. */
export async function GET() {
  try {
    const data = await getNarrativeWars();
    return NextResponse.json(ok(data), {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(err("NARRATIVE_WARS_UNAVAILABLE", message), { status: 503 });
  }
}
