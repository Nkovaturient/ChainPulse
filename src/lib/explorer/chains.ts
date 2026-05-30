/**
 * Multichain registry for the wallet explorer.
 * One Etherscan V2 API key covers all of these — pass chainid in the query.
 */

export type ChainKey =
  | 'ethereum' | 'base' | 'arbitrum' | 'optimism' | 'polygon' | 'bsc' | 'avalanche'
  | 'linea' | 'scroll' | 'zksync' | 'mantle' | 'blast' | 'gnosis' | 'polygonzkevm' | 'celo';

export interface ChainSpec {
  key: ChainKey;
  chainId: number;
  name: string;
  short: string;
  /** Native token symbol (ETH, BNB, etc.) */
  nativeSymbol: string;
  /** CoinGecko coin ID for the native asset (for USD price) */
  nativeCoingeckoId: string;
  /** CoinGecko `asset_platforms` slug for ERC-20 contract lookups */
  cgPlatform: string;
  /** Decimals of the native token (always 18 on EVM except some L2s) */
  nativeDecimals: number;
  /** Explorer base URL (used to link out txns / addresses) */
  explorerBaseUrl: string;
  /** Brand color hex */
  color: string;
}

export const CHAINS: ChainSpec[] = [
  {
    key: 'ethereum', chainId: 1, name: 'Ethereum', short: 'ETH',
    nativeSymbol: 'ETH', nativeCoingeckoId: 'ethereum', cgPlatform: 'ethereum',
    nativeDecimals: 18, explorerBaseUrl: 'https://etherscan.io',
    color: '#627eea',
  },
  {
    key: 'base', chainId: 8453, name: 'Base', short: 'BASE',
    nativeSymbol: 'ETH', nativeCoingeckoId: 'ethereum', cgPlatform: 'base',
    nativeDecimals: 18, explorerBaseUrl: 'https://basescan.org',
    color: '#0052ff',
  },
  {
    key: 'arbitrum', chainId: 42161, name: 'Arbitrum', short: 'ARB',
    nativeSymbol: 'ETH', nativeCoingeckoId: 'ethereum', cgPlatform: 'arbitrum-one',
    nativeDecimals: 18, explorerBaseUrl: 'https://arbiscan.io',
    color: '#28a0f0',
  },
  {
    key: 'optimism', chainId: 10, name: 'Optimism', short: 'OP',
    nativeSymbol: 'ETH', nativeCoingeckoId: 'ethereum', cgPlatform: 'optimistic-ethereum',
    nativeDecimals: 18, explorerBaseUrl: 'https://optimistic.etherscan.io',
    color: '#ff0420',
  },
  {
    key: 'polygon', chainId: 137, name: 'Polygon', short: 'POL',
    nativeSymbol: 'POL', nativeCoingeckoId: 'matic-network', cgPlatform: 'polygon-pos',
    nativeDecimals: 18, explorerBaseUrl: 'https://polygonscan.com',
    color: '#8247e5',
  },
  {
    key: 'bsc', chainId: 56, name: 'BNB Chain', short: 'BNB',
    nativeSymbol: 'BNB', nativeCoingeckoId: 'binancecoin', cgPlatform: 'binance-smart-chain',
    nativeDecimals: 18, explorerBaseUrl: 'https://bscscan.com',
    color: '#f3ba2f',
  },
  {
    key: 'avalanche', chainId: 43114, name: 'Avalanche', short: 'AVAX',
    nativeSymbol: 'AVAX', nativeCoingeckoId: 'avalanche-2', cgPlatform: 'avalanche',
    nativeDecimals: 18, explorerBaseUrl: 'https://snowtrace.io',
    color: '#e84142',
  },
  {
    key: 'linea', chainId: 59144, name: 'Linea', short: 'LINEA',
    nativeSymbol: 'ETH', nativeCoingeckoId: 'ethereum', cgPlatform: 'linea',
    nativeDecimals: 18, explorerBaseUrl: 'https://lineascan.build',
    color: '#61dfff',
  },
  {
    key: 'scroll', chainId: 534352, name: 'Scroll', short: 'SCRL',
    nativeSymbol: 'ETH', nativeCoingeckoId: 'ethereum', cgPlatform: 'scroll',
    nativeDecimals: 18, explorerBaseUrl: 'https://scrollscan.com',
    color: '#f0a070',
  },
  {
    key: 'zksync', chainId: 324, name: 'zkSync Era', short: 'ZKS',
    nativeSymbol: 'ETH', nativeCoingeckoId: 'ethereum', cgPlatform: 'zksync',
    nativeDecimals: 18, explorerBaseUrl: 'https://era.zksync.network',
    color: '#8c8dfc',
  },
  {
    key: 'mantle', chainId: 5000, name: 'Mantle', short: 'MNT',
    nativeSymbol: 'MNT', nativeCoingeckoId: 'mantle', cgPlatform: 'mantle',
    nativeDecimals: 18, explorerBaseUrl: 'https://mantlescan.xyz',
    color: '#65b3ae',
  },
  {
    key: 'blast', chainId: 81457, name: 'Blast', short: 'BLAST',
    nativeSymbol: 'ETH', nativeCoingeckoId: 'ethereum', cgPlatform: 'blast',
    nativeDecimals: 18, explorerBaseUrl: 'https://blastscan.io',
    color: '#fcd535',
  },
  {
    key: 'gnosis', chainId: 100, name: 'Gnosis', short: 'GNO',
    nativeSymbol: 'xDAI', nativeCoingeckoId: 'xdai', cgPlatform: 'xdai',
    nativeDecimals: 18, explorerBaseUrl: 'https://gnosisscan.io',
    color: '#04795b',
  },
  {
    key: 'polygonzkevm', chainId: 1101, name: 'Polygon zkEVM', short: 'zkEVM',
    nativeSymbol: 'ETH', nativeCoingeckoId: 'ethereum', cgPlatform: 'polygon-zkevm',
    nativeDecimals: 18, explorerBaseUrl: 'https://zkevm.polygonscan.com',
    color: '#7b3fe4',
  },
  {
    key: 'celo', chainId: 42220, name: 'Celo', short: 'CELO',
    nativeSymbol: 'CELO', nativeCoingeckoId: 'celo', cgPlatform: 'celo',
    nativeDecimals: 18, explorerBaseUrl: 'https://celoscan.io',
    color: '#35d07f',
  },
];

export const CHAIN_BY_KEY: Record<ChainKey, ChainSpec> = CHAINS.reduce(
  (acc, c) => ({ ...acc, [c.key]: c }),
  {} as Record<ChainKey, ChainSpec>,
);

export function isChainKey(k: string): k is ChainKey {
  return (CHAINS as readonly { key: string }[]).some((c) => c.key === k);
}

export const CHAIN_COUNT = CHAINS.length;

/** Comma-separated chain names for marketing / empty-state copy. */
export function chainNamesBlurb(max = CHAIN_COUNT): string {
  const names = CHAINS.slice(0, max).map((c) => c.name);
  if (max >= CHAIN_COUNT) return names.join(', ');
  return `${names.join(', ')}, and more`;
}
