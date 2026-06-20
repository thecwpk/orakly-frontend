/** Human-readable feed title from `/dapp` URL filters. */
export function resolveHubFeedTitle(params: {
  cat?: string | null;
  narrative?: string | null;
  breaking?: boolean;
  sort?: string | null;
}): string {
  if (params.breaking) return "Breaking";
  if (params.narrative) return params.narrative;
  if (params.cat) {
    return params.cat
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  if (params.sort === "volume") return "High volume";
  return "Trending";
}
