/**
 * CoinGecko helpers for valuing native + ERC-20 holdings in USD.
 * Free demo-tier endpoints: ~30 req/min. We batch by platform to keep call count low.
 */
import { CHAIN_BY_KEY, type ChainKey } from './chains';

function cgKey() {
  return process.env.COINGECKO_API_KEY || 'demo';
}
function cgHeaders(): HeadersInit {
  return { 'x-cg-demo-api-key': cgKey() };
}

// ─── Native prices (ETH, BNB, POL, AVAX) ─────────────────────────────────────

/**
 * Returns a map of ChainKey → USD price for that chain's native token.
 * One call hits CoinGecko `/simple/price` for the unique set of underlying
 * native coin IDs (e.g. ETH covers ethereum/base/arb/op).
 */
export async function fetchNativePrices(): Promise<Record<ChainKey, number>> {
  const uniqueIds = Array.from(
    new Set(Object.values(CHAIN_BY_KEY).map((c) => c.nativeCoingeckoId)),
  );
  const out = Object.fromEntries(
    (Object.keys(CHAIN_BY_KEY) as ChainKey[]).map((k) => [k, 0]),
  ) as Record<ChainKey, number>;

  try {
    const url =
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(uniqueIds.join(','))}&vs_currencies=usd`;
    const res = await fetch(url, { headers: cgHeaders(), next: { revalidate: 60 } });
    if (!res.ok) return out;
    const json = (await res.json()) as Record<string, { usd: number }>;
    for (const chain of Object.keys(CHAIN_BY_KEY) as ChainKey[]) {
      const id = CHAIN_BY_KEY[chain].nativeCoingeckoId;
      out[chain] = json[id]?.usd ?? 0;
    }
    return out;
  } catch {
    return out;
  }
}

// ─── ERC-20 token prices via contract address ────────────────────────────────

export interface TokenPriceMap {
  /** lowercase contract → USD price */
  [contract: string]: number;
}

/**
 * Look up USD prices for a list of token contracts on a specific chain.
 * Single call to `/simple/token_price/{platform}`.
 */
export async function fetchTokenPrices(
  chain: ChainKey,
  contracts: string[],
): Promise<TokenPriceMap> {
  if (!contracts.length) return {};
  const platform = CHAIN_BY_KEY[chain].cgPlatform;
  // CoinGecko caps ~100 contracts per call; chunk just in case
  const chunks: string[][] = [];
  for (let i = 0; i < contracts.length; i += 100) {
    chunks.push(contracts.slice(i, i + 100));
  }
  const merged: TokenPriceMap = {};
  for (const chunk of chunks) {
    try {
      const url =
        `https://api.coingecko.com/api/v3/simple/token_price/${platform}` +
        `?contract_addresses=${encodeURIComponent(chunk.join(','))}&vs_currencies=usd`;
      const res = await fetch(url, { headers: cgHeaders(), next: { revalidate: 60 } });
      if (!res.ok) continue;
      const json = (await res.json()) as Record<string, { usd?: number }>;
      for (const [addr, v] of Object.entries(json)) {
        if (typeof v?.usd === 'number') merged[addr.toLowerCase()] = v.usd;
      }
    } catch {
      // skip chunk
    }
  }
  return merged;
}
