import { redirect } from "next/navigation";

export type DiscoverySearchParams = Record<
  string,
  string | string[] | undefined
>;

/**
 * Canonical discovery URLs include `trending` so bookmarks reflect tape mode.
 * Visiting `/markets` without `trending` redirects once to `trending=1`,
 * preserving every other query key (search, category, sort).
 */
export function ensureDiscoveryTrendingSearchParam(
  pathname: "/markets",
  searchParams: DiscoverySearchParams,
): void {
  if (searchParams.trending !== undefined) return;

  const qs = new URLSearchParams();
  for (const [key, raw] of Object.entries(searchParams)) {
    if (raw === undefined) continue;
    if (Array.isArray(raw)) {
      for (const part of raw) qs.append(key, part);
    } else {
      qs.set(key, raw);
    }
  }
  qs.set("trending", "1");
  redirect(`${pathname}?${qs.toString()}`);
}
