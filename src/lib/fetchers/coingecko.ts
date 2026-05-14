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

interface CoinSearchResult {
  id: string;
  symbol: string;
  name: string;
}

// Comprehensive symbol / common-name → CoinGecko ID map
// Covers the ~60 most-queried assets so the search fallback is rarely needed
const COIN_ALIAS: Record<string, string> = {
  // majors
  btc: 'bitcoin', bitcoin: 'bitcoin',
  eth: 'ethereum', ether: 'ethereum', ethereum: 'ethereum',
  sol: 'solana', solana: 'solana',
  bnb: 'binancecoin', 'binance coin': 'binancecoin', binancecoin: 'binancecoin',
  xrp: 'ripple', ripple: 'ripple',
  ada: 'cardano', cardano: 'cardano',
  doge: 'dogecoin', dogecoin: 'dogecoin',
  dot: 'polkadot', polkadot: 'polkadot',
  shib: 'shiba-inu', 'shiba inu': 'shiba-inu', 'shiba-inu': 'shiba-inu',
  ltc: 'litecoin', litecoin: 'litecoin',
  bch: 'bitcoin-cash', 'bitcoin cash': 'bitcoin-cash',
  xlm: 'stellar', stellar: 'stellar',
  trx: 'tron', tron: 'tron',
  // layer-2 / ecosystem
  avax: 'avalanche-2', avalanche: 'avalanche-2', 'avalanche-2': 'avalanche-2',
  matic: 'matic-network', polygon: 'matic-network', 'matic-network': 'matic-network',
  arb: 'arbitrum', arbitrum: 'arbitrum',
  op: 'optimism', optimism: 'optimism',
  atom: 'cosmos', cosmos: 'cosmos',
  near: 'near', 'near protocol': 'near',
  ftm: 'fantom', fantom: 'fantom',
  algo: 'algorand', algorand: 'algorand',
  icp: 'internet-computer', 'internet computer': 'internet-computer',
  vet: 'vechain', vechain: 'vechain',
  hbar: 'hedera-hashgraph', hedera: 'hedera-hashgraph',
  stx: 'stacks', stacks: 'stacks',
  flow: 'flow', 'flow blockchain': 'flow',
  egld: 'elrond-erd-2', multiversx: 'elrond-erd-2', elrond: 'elrond-erd-2',
  xtz: 'tezos', tezos: 'tezos',
  // move-based
  apt: 'aptos', aptos: 'aptos',
  sui: 'sui', 'sui network': 'sui',
  // defi blue-chips
  link: 'chainlink', chainlink: 'chainlink',
  uni: 'uniswap', uniswap: 'uniswap',
  aave: 'aave',
  mkr: 'maker', maker: 'maker',
  crv: 'curve-dao-token', curve: 'curve-dao-token',
  snx: 'havven', synthetix: 'havven',
  comp: 'compound-governance-token', compound: 'compound-governance-token',
  ldo: 'lido-dao', 'lido dao': 'lido-dao', lido: 'lido-dao',
  rpl: 'rocket-pool', 'rocket pool': 'rocket-pool',
  gmx: 'gmx',
  pendle: 'pendle',
  // modular / infra
  tia: 'celestia', celestia: 'celestia',
  sei: 'sei-network', 'sei network': 'sei-network',
  inj: 'injective-protocol', injective: 'injective-protocol',
  pyth: 'pyth-network', 'pyth network': 'pyth-network',
  w: 'wormhole', wormhole: 'wormhole',
  jto: 'jito-governance-token', jito: 'jito-governance-token',
  jup: 'jupiter-exchange-solana', jupiter: 'jupiter-exchange-solana',
  // memes / culture
  pepe: 'pepe',
  wif: 'dogwifcoin', 'dog wif hat': 'dogwifcoin', dogwifhat: 'dogwifcoin',
  bonk: 'bonk',
  // gaming / metaverse
  sand: 'the-sandbox', 'the sandbox': 'the-sandbox',
  mana: 'decentraland', decentraland: 'decentraland',
  axs: 'axie-infinity', 'axie infinity': 'axie-infinity',
  // stablecoins (included so we don't blow up on them)
  usdt: 'tether', tether: 'tether',
  usdc: 'usd-coin', 'usd coin': 'usd-coin',
  dai: 'dai',
  frax: 'frax',
};

/** Resolve a loose coin name/symbol to its canonical CoinGecko ID. */
function resolveId(raw: string): string {
  const key = raw.trim().toLowerCase();
  return COIN_ALIAS[key] ?? key; // passthrough — CoinGecko often accepts the slug directly
}

/** Search CoinGecko for an unknown token and return its ID (best-effort). */
async function searchCoinId(query: string, headers: HeadersInit): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`,
      { headers, cache: 'no-store' },
    );
    if (!res.ok) return null;
    const { coins } = (await res.json()) as { coins: CoinSearchResult[] };
    return coins?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

export async function fetchPrices(rawIds: string[]): Promise<PriceData[]> {
  if (!rawIds.length) return [];
  const apiKey = process.env.COINGECKO_API_KEY || 'demo';
  const headers: HeadersInit = { 'x-cg-demo-api-key': apiKey };

  // 1. Resolve all raw names/symbols to canonical IDs
  const resolvedIds = [...new Set(rawIds.map(resolveId))];

  // 2. First attempt — bulk markets call
  const data = await fetchMarkets(resolvedIds, headers);

  // 3. For any requested coins that came back empty, try CoinGecko search
  const foundIds = new Set(data.map((d) => d.id));
  const missing = resolvedIds.filter((id) => !foundIds.has(id));

  if (missing.length) {
    const resolved = await Promise.all(
      missing.map(async (id) => {
        const found = await searchCoinId(id, headers);
        return found && found !== id ? found : null;
      }),
    );
    const extra = resolved.filter(Boolean) as string[];
    if (extra.length) {
      const extraData = await fetchMarkets(extra, headers);
      data.push(...extraData);
    }
  }

  return data;
}

async function fetchMarkets(coinIds: string[], headers: HeadersInit): Promise<PriceData[]> {
  if (!coinIds.length) return [];
  try {
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
      sparkline: (c.sparkline_in_7d?.price ?? []).filter(
        (_, i, a) => i % Math.max(1, Math.floor(a.length / 30)) === 0,
      ),
      source: 'coingecko' as const,
      fetchedAt,
    }));
  } catch {
    return [];
  }
}
