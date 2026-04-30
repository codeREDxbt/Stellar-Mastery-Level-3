interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  ttl: number;
}

export class StellarCache {
  private store = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T, ttl = 30_000): void {
    this.store.set(key, { data, fetchedAt: Date.now(), ttl });
  }

  get<T>(key: string): { data: T; isStale: boolean } | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    const age = Date.now() - entry.fetchedAt;
    return { data: entry.data, isStale: age > entry.ttl };
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }
}

export const stellarCache = new StellarCache();
export const CACHE_TTL = { balance: 30_000, payments: 60_000 };
