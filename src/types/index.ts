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
  amountNative?: number;
  chain: 'ethereum' | 'solana';
  timestamp: string;
  explorerUrl: string;
}

export type InsiderAlertKind =
  | 'whale_tx'
  | 'unusual_gas'
  | 'dex_liquidity'
  | 'memecoin_momentum'
  | 'token_unlock'
  | 'deployer_activity';

export type InsiderCategory = 'memecoin' | 'bluechip' | 'defi' | 'ai' | 'other';

export interface InsiderCitation {
  type: 'alert' | 'tx' | 'price' | 'defi' | 'news' | 'gas';
  label: string;
  url?: string;
  alertId?: string;
  fetchedAt: string;
  source: string;
}

export interface InsiderAlertRef {
  id: string;
  chain: string;
  kind: string;
  category: string;
  summary: string;
  amountUsd: number | null;
  txHash: string;
  sourceUrl: string | null;
  detectedAt: string;
}

export interface InsiderEvidence {
  citations: InsiderCitation[];
  alerts?: InsiderAlertRef[];
  tools?: Partial<QueryResponse>;
  category?: InsiderCategory | 'all';
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
  premiumExpiresAt: string | null;
  eliteExpiresAt: string | null;
  created_at: string;
  last_login: string | null;
}

export interface TrackedWallet {
  id: string;
  address: string;
  label: string | null;
  created_at: string;
}
