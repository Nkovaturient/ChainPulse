import { allowApiCall, cachedFetch } from '@/lib/insider/rate-limit';
import type { InsiderScanner } from '@/lib/insider/scanners/types';

interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank?: number;
  score?: number;
}

interface BirdeyeToken {
  address: string;
  symbol?: string;
  name?: string;
  liquidity?: number;
  v24hUSD?: number;
}

async function fetchCoinGeckoTrending(): Promise<TrendingCoin[]> {
  const apiKey = process.env.COINGECKO_API_KEY || 'demo';
  const res = await fetch('https://api.coingecko.com/api/v3/search/trending', {
    headers: { 'x-cg-demo-api-key': apiKey },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { coins?: { item: TrendingCoin }[] };
  return (json.coins ?? []).map((c) => c.item).slice(0, 5);
}

async function fetchBirdeyeTrending(): Promise<BirdeyeToken[]> {
  const apiKey = process.env.BIRDEYE_API_KEY;
  if (!apiKey || !allowApiCall('birdeye-trending', 30)) return [];

  const res = await fetch('https://public-api.birdeye.so/defi/token_trending?sort_by=rank&sort_type=asc&offset=0&limit=5', {
    headers: {
      'X-API-KEY': apiKey,
      accept: 'application/json',
      'x-chain': 'solana',
    },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: { tokens?: BirdeyeToken[] } };
  return json.data?.tokens ?? [];
}

const MEME_HINTS = /\b(dog|cat|pepe|wif|bonk|meme|inu|moon)\b/i;

export const scanMemecoinMomentum: InsiderScanner = async () => {
  const [cgTrending, birdeye] = await Promise.all([
    cachedFetch('coingecko-trending', 10 * 60 * 1000, fetchCoinGeckoTrending),
    cachedFetch('birdeye-trending', 10 * 60 * 1000, fetchBirdeyeTrending),
  ]);

  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const drafts = [];

  for (const coin of cgTrending) {
    const isMeme = MEME_HINTS.test(coin.name) || MEME_HINTS.test(coin.symbol);
    if (!isMeme && (coin.market_cap_rank ?? 999) < 200) continue;

    drafts.push({
      chain: 'multi',
      kind: 'memecoin_momentum' as const,
      category: 'memecoin' as const,
      address: coin.id,
      txHash: `meme-cg-${coin.id}-${day}`,
      amountUsd: null,
      summary: `Memecoin momentum — ${coin.name} (${coin.symbol.toUpperCase()}) trending on CoinGecko.`,
      sourceUrl: `https://www.coingecko.com/en/coins/${coin.id}`,
      detectedAt: now,
      metadata: { symbol: coin.symbol.toUpperCase(), source: 'coingecko', score: coin.score },
    });
  }

  for (const token of birdeye) {
    drafts.push({
      chain: 'solana',
      kind: 'memecoin_momentum' as const,
      category: 'memecoin' as const,
      address: token.address,
      txHash: `meme-be-${token.address.slice(0, 12)}-${day}`,
      amountUsd: token.v24hUSD ?? null,
      summary: `Solana memecoin heat — ${token.name ?? token.symbol ?? 'token'} trending on Birdeye (24h vol $${((token.v24hUSD ?? 0) / 1000).toFixed(0)}K).`,
      sourceUrl: `https://birdeye.so/token/${token.address}?chain=solana`,
      detectedAt: now,
      metadata: {
        symbol: token.symbol,
        liquidity: token.liquidity,
        source: 'birdeye',
      },
    });
  }

  return drafts.slice(0, 6);
};
