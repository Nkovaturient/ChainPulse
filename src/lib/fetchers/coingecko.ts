import type { PriceData } from '@/types';

interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  sparkline_in_7d?: { price?: number[] };
}

export async function fetchPrices(coinIds: string[]): Promise<PriceData[]> {
  if (!coinIds.length) return [];
  const apiKey = process.env.COINGECKO_API_KEY || 'demo';
  const headers: HeadersInit = { 'x-cg-demo-api-key': apiKey };

  try {
    // Single request: price + market_cap + 7-day sparkline all in one
    const url =
      `https://api.coingecko.com/api/v3/coins/markets` +
      `?vs_currency=usd` +
      `&ids=${encodeURIComponent(coinIds.join(','))}` +
      `&order=market_cap_desc` +
      `&sparkline=true` +
      `&price_change_percentage=24h`;

    const res = await fetch(url, { headers, cache: 'no-store' });
    if (!res.ok) return [];

    const json = (await res.json()) as CoinMarket[];
    const fetchedAt = new Date().toISOString();

    return json.map((c) => ({
      id: c.id,
      symbol: c.symbol.toUpperCase(),
      name: c.name,
      usd: c.current_price ?? 0,
      usd_24h_change: c.price_change_percentage_24h ?? 0,
      usd_market_cap: c.market_cap ?? 0,
      sparkline: (c.sparkline_in_7d?.price ?? []).filter((_, i, a) =>
        i % Math.max(1, Math.floor(a.length / 30)) === 0
      ),
      source: 'coingecko' as const,
      fetchedAt,
    }));
  } catch {
    return [];
  }
}
