export interface IntentResult {
  intents: ('PRICE' | 'WHALE' | 'NEWS' | 'DEFI_TVL' | 'STAKING' | 'GOVERNANCE')[];
  coins: string[];
  language: 'en' | 'hi' | 'bn';
}

export interface PriceData {
  id: string;
  symbol: string;
  name: string;
  usd: number;
  usd_24h_change: number;
  usd_market_cap: number;
  sparkline: number[];
  source: 'coingecko';
  fetchedAt: string;
}

export interface WhaleTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  chain: 'ethereum' | 'solana';
  timestamp: string;
  explorerUrl: string;
}

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

export interface DefiProtocol {
  name: string;
  tvl: number;
  change_1d: number;
  category: string;
  url: string;
}

export interface StakingPool {
  project: string;
  symbol: string;
  apy: number;
  tvlUsd: number;
  chain: string;
}

export interface QueryResponse {
  price?: PriceData[];
  whale?: WhaleTransaction[];
  news?: NewsItem[];
  defi?: DefiProtocol[];
  staking?: StakingPool[];
  summary: string;
  language: 'en' | 'hi' | 'bn';
  errors: Record<string, string>;
}

export type Language = 'en' | 'hi' | 'bn';

export type UserRole =
  | 'student'
  | 'trader'
  | 'crypto_investor'
  | 'just_exploring'
  | 'tech_savvy';

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  created_at: string;
  last_login: string | null;
}
