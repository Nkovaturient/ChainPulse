export function parseNativeAmount(value: string | number | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const raw = String(value ?? '0');
  const match = raw.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
}

export function shortAddress(addr: string): string {
  if (!addr || addr.length < 12) return addr || '—';
  return `${addr.slice(0, 8)}…${addr.slice(-4)}`;
}

export function formatUsd(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}
