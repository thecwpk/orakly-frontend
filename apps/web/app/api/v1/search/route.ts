import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { err, ok } from "../_lib/response";
import {
  runGlobalSearch,
  type SearchTypes,
} from "@/server/queries/global-search";

const ALL_TYPES: SearchTypes[] = [
  "markets",
  "narratives",
  "creators",
  "wallets",
];

function parseTypes(raw: string | null): Set<SearchTypes> {
  if (!raw?.trim()) return new Set(ALL_TYPES);
  const parts = raw
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  const set = new Set<SearchTypes>();
  for (const p of parts) {
    if ((ALL_TYPES as string[]).includes(p)) {
      set.add(p as SearchTypes);
    }
  }
  return set.size > 0 ? set : new Set(ALL_TYPES);
}

/** GET /api/v1/search?q=&types=markets,narratives,creators,wallets */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() ?? "";
  const types = parseTypes(sp.get("types"));

  if (!q) {
    return NextResponse.json(
      ok({ markets: [], narratives: [], creators: [], wallets: [] }),
      {
        headers: {
          "Cache-Control": "public, max-age=5, stale-while-revalidate=30",
        },
      },
    );
  }

  try {
    const data = await runGlobalSearch({ q, types });
    return NextResponse.json(ok(data), {
      headers: {
        "Cache-Control": "public, max-age=10, stale-while-revalidate=60",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(err("SEARCH_UNAVAILABLE", message), { status: 503 });
  }
}
