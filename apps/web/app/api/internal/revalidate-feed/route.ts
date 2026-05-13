import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { cacheTags } from "@/cache/next-tags";

/**
 * Called by Railway worker after crypto ingest — bust Next.js Data Cache tags.
 * `Authorization: Bearer ${VERCEL_REVALIDATE_SECRET}`.
 */
export async function POST(req: Request) {
  const secret = process.env.VERCEL_REVALIDATE_SECRET?.trim();
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  revalidateTag(cacheTags.cryptoFeed);
  revalidateTag(cacheTags.marketsFeed);

  return NextResponse.json({
    ok: true,
    tags: [cacheTags.cryptoFeed, cacheTags.marketsFeed],
  });
}
