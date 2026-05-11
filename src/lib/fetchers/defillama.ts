import type { DefiProtocol, StakingPool } from '@/types';

interface LlamaProtocol {
  name: string;
  tvl: number;
  change_1d?: number;
  category?: string;
  url?: string;
  slug?: string;
}

interface LlamaPool {
  project: string;
  symbol: string;
  apy: number;
  tvlUsd: number;
  chain: string;
  ilRisk?: string;
}

export async function fetchDefiTVL(): Promise<DefiProtocol[]> {
  try {
    const res = await fetch('https://api.llama.fi/protocols', { cache: 'no-store' });
    if (!res.ok) return [];
    const json = (await res.json()) as LlamaProtocol[];
    return json
      .filter((p) => typeof p.tvl === 'number' && p.tvl > 500_000_000)
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, 10)
      .map((p) => ({
        name: p.name,
        tvl: p.tvl,
        change_1d: p.change_1d ?? 0,
        category: p.category ?? '—',
        url: p.url || (p.slug ? `https://defillama.com/protocol/${p.slug}` : 'https://defillama.com'),
      }));
  } catch {
    return [];
  }
}

export async function fetchStakingYields(): Promise<StakingPool[]> {
  try {
    const res = await fetch('https://yields.llama.fi/pools', { cache: 'no-store' });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: LlamaPool[] };
    const pools = Array.isArray(json.data) ? json.data : [];
    return pools
      .filter((p) => p.apy > 3 && p.tvlUsd > 1_000_000 && p.ilRisk !== 'yes')
      .sort((a, b) => b.apy - a.apy)
      .slice(0, 8)
      .map((p) => ({
        project: p.project,
        symbol: p.symbol,
        apy: p.apy,
        tvlUsd: p.tvlUsd,
        chain: p.chain,
      }));
  } catch {
    return [];
  }
}
