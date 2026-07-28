import { cachedFetch } from '@/lib/insider/rate-limit';
import type { InsiderScanner } from '@/lib/insider/scanners/types';

interface LlamaProtocol {
  name: string;
  slug?: string;
  tvl: number;
  change_1d?: number;
  category?: string;
  url?: string;
}

const MIN_TVL = 100_000_000;
const MIN_CHANGE_1D = 4;

export const scanDexLiquidity: InsiderScanner = async () => {
  const protocols = await cachedFetch('defillama-protocols', 10 * 60 * 1000, async () => {
    const res = await fetch('https://api.llama.fi/protocols', { cache: 'no-store' });
    if (!res.ok) return [] as LlamaProtocol[];
    return (await res.json()) as LlamaProtocol[];
  });

  const now = new Date();
  const day = now.toISOString().slice(0, 10);

  return protocols
    .filter((p) => typeof p.tvl === 'number' && p.tvl >= MIN_TVL)
    .filter((p) => (p.change_1d ?? 0) >= MIN_CHANGE_1D)
    .sort((a, b) => (b.change_1d ?? 0) - (a.change_1d ?? 0))
    .slice(0, 3)
    .map((p) => ({
      chain: 'multi',
      kind: 'dex_liquidity' as const,
      category: 'defi' as const,
      address: p.slug ?? p.name,
      txHash: `dex-${p.slug ?? p.name}-${day}`,
      amountUsd: p.tvl,
      summary: `Large DeFi TVL inflow — ${p.name} +${(p.change_1d ?? 0).toFixed(1)}% 1d (TVL $${(p.tvl / 1e9).toFixed(2)}B).`,
      sourceUrl: p.url || (p.slug ? `https://defillama.com/protocol/${p.slug}` : 'https://defillama.com'),
      detectedAt: now,
      metadata: {
        protocol: p.name,
        change1d: p.change_1d ?? 0,
        category: p.category ?? 'DeFi',
      },
    }));
};
