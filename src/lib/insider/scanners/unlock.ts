import { cachedFetch } from '@/lib/insider/rate-limit';
import type { InsiderScanner } from '@/lib/insider/scanners/types';

interface EmissionEvent {
  label?: string;
  timestamp?: number;
  amount?: number;
}

interface EmissionProtocol {
  name: string;
  gecko_id?: string;
  events?: EmissionEvent[];
}

const HORIZON_MS = 7 * 24 * 60 * 60 * 1000;

export const scanTokenUnlocks: InsiderScanner = async () => {
  const emissions = await cachedFetch('defillama-emissions', 30 * 60 * 1000, async () => {
    const res = await fetch('https://api.llama.fi/emissions', { cache: 'no-store' });
    if (!res.ok) return [] as EmissionProtocol[];
    return (await res.json()) as EmissionProtocol[];
  });

  const now = Date.now();
  const drafts = [];

  for (const protocol of emissions) {
    const upcoming = (protocol.events ?? []).filter((e) => {
      if (!e.timestamp) return false;
      const ts = e.timestamp * 1000;
      return ts >= now && ts <= now + HORIZON_MS;
    });
    if (!upcoming.length) continue;

    const next = upcoming.sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))[0];
    const unlockDate = new Date((next.timestamp ?? 0) * 1000);
    const day = unlockDate.toISOString().slice(0, 10);

    drafts.push({
      chain: 'multi',
      kind: 'token_unlock' as const,
      category: 'defi' as const,
      address: protocol.gecko_id ?? protocol.name,
      txHash: `unlock-${protocol.name}-${day}`,
      amountUsd: null,
      summary: `Token unlock approaching — ${protocol.name} unlock on ${unlockDate.toLocaleDateString()}${next.label ? ` (${next.label})` : ''}.`,
      sourceUrl: protocol.gecko_id
        ? `https://www.coingecko.com/en/coins/${protocol.gecko_id}`
        : 'https://defillama.com/unlocks',
      detectedAt: new Date(),
      metadata: {
        unlockAt: unlockDate.toISOString(),
        label: next.label,
        amount: next.amount,
      },
    });
  }

  return drafts.slice(0, 4);
};
