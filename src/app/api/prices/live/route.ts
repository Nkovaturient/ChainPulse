import { NextResponse } from 'next/server';
import { fetchPrices } from '@/lib/fetchers/coingecko';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Cache the response for 30 seconds at the edge
export const revalidate = 30;

const COINS = ['bitcoin', 'ethereum', 'solana'];

export async function GET() {
  try {
    const prices = await fetchPrices(COINS);
    const res = NextResponse.json({ prices, ts: Date.now() });
    // 30s shared cache
    res.headers.set('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    return res;
  } catch (e) {
    console.error('[prices/live]', e);
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
  }
}
