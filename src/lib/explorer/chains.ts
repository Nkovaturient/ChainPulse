/**
 * Multichain registry for the wallet explorer.
 * One Etherscan V2 API key covers all of these — pass chainid in the query.
 */

export type ChainKey = 'ethereum' | 'base' | 'arbitrum' | 'optimism' | 'polygon' | 'bsc' | 'avalanche';

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
];

export const CHAIN_BY_KEY: Record<ChainKey, ChainSpec> = CHAINS.reduce(
  (acc, c) => ({ ...acc, [c.key]: c }),
  {} as Record<ChainKey, ChainSpec>,
);

export function isChainKey(k: string): k is ChainKey {
  return (CHAINS as readonly { key: string }[]).some((c) => c.key === k);
}
