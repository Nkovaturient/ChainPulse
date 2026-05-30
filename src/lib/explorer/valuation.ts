/**
 * CoinGecko helpers for valuing native + ERC-20 holdings in USD.
 * Free demo-tier endpoints: ~30 req/min. We batch by platform to keep call count low.
 */
import { CHAIN_BY_KEY, type ChainKey } from './chains';
import { bucketFromCategories } from './categories';

function cgKey() {
  return process.env.COINGECKO_API_KEY || 'demo';
}
function cgHeaders(): HeadersInit {
  return { 'x-cg-demo-api-key': cgKey() };
}

export interface PriceInfo {
  usd: number;
  change24h: number | null;
}

// ─── Native prices (ETH, BNB, POL, AVAX) ─────────────────────────────────────

/**
 * Returns a map of ChainKey → price info for that chain's native token.
 * One call hits CoinGecko `/simple/price` for the unique set of underlying
 * native coin IDs (e.g. ETH covers ethereum/base/arb/op) including 24h change.
 */
export async function fetchNativePrices(): Promise<Record<ChainKey, PriceInfo>> {
  const uniqueIds = Array.from(
    new Set(Object.values(CHAIN_BY_KEY).map((c) => c.nativeCoingeckoId)),
  );
  const out = Object.fromEntries(
    (Object.keys(CHAIN_BY_KEY) as ChainKey[]).map((k) => [k, { usd: 0, change24h: null }]),
  ) as Record<ChainKey, PriceInfo>;

  try {
    const url =
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(uniqueIds.join(','))}` +
      `&vs_currencies=usd&include_24hr_change=true`;
    const res = await fetch(url, { headers: cgHeaders(), next: { revalidate: 60 } });
    if (!res.ok) return out;
    const json = (await res.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;
    for (const chain of Object.keys(CHAIN_BY_KEY) as ChainKey[]) {
      const id = CHAIN_BY_KEY[chain].nativeCoingeckoId;
      const hit = json[id];
      out[chain] = {
        usd: hit?.usd ?? 0,
        change24h: typeof hit?.usd_24h_change === 'number' ? hit.usd_24h_change : null,
      };
    }
    return out;
  } catch {
    return out;
  }
}

// ─── ERC-20 token prices via contract address ────────────────────────────────

export interface TokenPriceMap {
  /** lowercase contract → price info */
  [contract: string]: PriceInfo;
}

/**
 * Look up USD prices (+ 24h change) for a list of token contracts on a chain.
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
        `?contract_addresses=${encodeURIComponent(chunk.join(','))}&vs_currencies=usd&include_24hr_change=true`;
      const res = await fetch(url, { headers: cgHeaders(), next: { revalidate: 60 } });
      if (!res.ok) continue;
      const json = (await res.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;
      for (const [addr, v] of Object.entries(json)) {
        if (typeof v?.usd === 'number') {
          merged[addr.toLowerCase()] = {
            usd: v.usd,
            change24h: typeof v.usd_24h_change === 'number' ? v.usd_24h_change : null,
          };
        }
      }
    } catch {
      // skip chunk
    }
  }
  return merged;
}

// ─── Category lookups (live CoinGecko, bounded by caller) ─────────────────────

/** Run promise factories with a small concurrency cap to respect rate limits. */
async function mapLimited<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

const CG_COIN_PARAMS =
  'localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false';

/** Category bucket for a native coin by CoinGecko id. */
export async function fetchNativeCategory(coingeckoId: string): Promise<string | null> {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coingeckoId)}?${CG_COIN_PARAMS}`;
    const res = await fetch(url, { headers: cgHeaders(), next: { revalidate: 86_400 } });
    if (!res.ok) return null;
    const json = (await res.json()) as { categories?: string[] };
    return bucketFromCategories(json.categories);
  } catch {
    return null;
  }
}

/** Category bucket for a token by contract on a given chain. */
export async function fetchTokenCategory(chain: ChainKey, contract: string): Promise<string | null> {
  try {
    const platform = CHAIN_BY_KEY[chain].cgPlatform;
    const url =
      `https://api.coingecko.com/api/v3/coins/${platform}/contract/${contract.toLowerCase()}`;
    const res = await fetch(url, { headers: cgHeaders(), next: { revalidate: 86_400 } });
    if (!res.ok) return null;
    const json = (await res.json()) as { categories?: string[] };
    return bucketFromCategories(json.categories);
  } catch {
    return null;
  }
}

export { mapLimited };
