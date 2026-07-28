const cache = new Map<string, { expiresAt: number; value: unknown }>();

export async function cachedFetch<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.value as T;
  }
  const value = await fetcher();
  cache.set(key, { expiresAt: Date.now() + ttlMs, value });
  return value;
}

const callCounts = new Map<string, { windowStart: number; count: number }>();

export function allowApiCall(name: string, maxPerHour: number): boolean {
  const now = Date.now();
  const row = callCounts.get(name);
  if (!row || now - row.windowStart > 60 * 60 * 1000) {
    callCounts.set(name, { windowStart: now, count: 1 });
    return true;
  }
  if (row.count >= maxPerHour) return false;
  row.count += 1;
  return true;
}
