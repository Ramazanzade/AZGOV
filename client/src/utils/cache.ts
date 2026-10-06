interface CacheEntry<T> {
  data: T;
  expires: number;
}

const store = new Map<string, CacheEntry<any>>();

export const cacheGet = <T>(key: string): T | null => {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.data;
};

export const cacheSet = <T>(key: string, data: T, ttlMs = 10 * 60 * 1000): void => {
  store.set(key, { data, expires: Date.now() + ttlMs });
};