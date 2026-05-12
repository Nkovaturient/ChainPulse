/** Internal path only — avoids open redirects (e.g. //evil.com or https:). */
export function safePostAuthPath(raw: string | null | undefined, fallback: string): string {
  if (raw == null) return fallback;
  const t = raw.trim();
  if (!t.startsWith('/') || t.startsWith('//')) return fallback;
  return t;
}
