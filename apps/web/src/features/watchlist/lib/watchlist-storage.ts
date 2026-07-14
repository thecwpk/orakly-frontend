const STORAGE_KEY = "orakly_watchlist";
const CHANGE_EVENT = "orakly-watchlist-change";

let cachedIds: string[] = [];
let cachedSerialized = "[]";
let hydrated = false;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalize(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  return [
    ...new Set(
      ids.filter((id): id is string => typeof id === "string" && id.trim().length > 0),
    ),
  ].slice(0, 200);
}

function setCache(ids: unknown): string[] {
  const next = normalize(ids);
  const serialized = JSON.stringify(next);
  if (serialized === cachedSerialized) return cachedIds;
  cachedIds = next;
  cachedSerialized = serialized;
  return cachedIds;
}

export function readWatchlistIds(): string[] {
  if (!canUseStorage()) return cachedIds;
  if (!hydrated) {
    hydrated = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return setCache([]);
      return setCache(JSON.parse(raw) as unknown);
    } catch {
      return setCache([]);
    }
  }
  return cachedIds;
}

export function writeWatchlistIds(ids: string[]): void {
  const next = setCache(ids);
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
}

export function subscribeWatchlist(onStoreChange: () => void): () => void {
  if (!canUseStorage()) return () => undefined;

  // Ensure first client subscribe hydrates from localStorage.
  readWatchlistIds();

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    try {
      setCache(event.newValue ? (JSON.parse(event.newValue) as unknown) : []);
    } catch {
      setCache([]);
    }
    onStoreChange();
  };

  const onCustom = (event: Event) => {
    const detail = (event as CustomEvent<string[]>).detail;
    if (Array.isArray(detail)) setCache(detail);
    else readWatchlistIds();
    onStoreChange();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onCustom);
  };
}

export { STORAGE_KEY as WATCHLIST_STORAGE_KEY, CHANGE_EVENT as WATCHLIST_CHANGE_EVENT };
