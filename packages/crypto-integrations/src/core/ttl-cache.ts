/** Tiny TTL cache for single-node warm reuse (optional — primary cache lives in Next `unstable_cache`). */
export type TtlCacheEntry<T> = { value: T; expiresAt: number };

export class TtlMemoryCache<T> {
  private readonly store = new Map<string, TtlCacheEntry<T>>();
  private readonly maxKeys: number;

  constructor(maxKeys = 200) {
    this.maxKeys = maxKeys;
  }

  get(key: string): T | null {
    const row = this.store.get(key);
    if (!row) return null;
    if (Date.now() > row.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return row.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    if (this.store.size >= this.maxKeys) {
      const first = this.store.keys().next().value as string | undefined;
      if (first) this.store.delete(first);
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
}
