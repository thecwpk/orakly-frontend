import { NextResponse } from "next/server";
import { ok, err } from "../../_lib/response";
import { getCategoriesOverview } from "@/server/queries/categories-overview";

/** GET /api/v1/categories/overview — homepage category grid aggregates. */
export async function GET() {
  try {
    const data = await getCategoriesOverview();
    return NextResponse.json(ok(data), {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(err("CATEGORIES_UNAVAILABLE", message), { status: 503 });
  }
}
