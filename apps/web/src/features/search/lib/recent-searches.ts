const STORAGE_KEY = "orakly:recent-searches";
const MAX_RECENT = 5;

export function readRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .map((item) => item.trim())
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function pushRecentSearch(query: string): string[] {
  const q = query.trim();
  if (!q || typeof window === "undefined") return readRecentSearches();
  const next = [q, ...readRecentSearches().filter((item) => item.toLowerCase() !== q.toLowerCase())].slice(
    0,
    MAX_RECENT,
  );
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
  return next;
}
