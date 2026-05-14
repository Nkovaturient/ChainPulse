import type { ChainKey } from './chains';

export interface NativeBalance {
  chain: ChainKey;
  symbol: string;
  amount: number;      // human-readable (divided by 10^decimals)
  usd: number;         // USD value at lookup time
  pricePerUnit: number; // USD per native unit
}

export interface TokenHolding {
  chain: ChainKey;
  contractAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  amount: number;     // human-readable balance
  usd: number | null; // null when CoinGecko has no listing for the token
  pricePerUnit: number | null;
}

export interface ChainActivity {
  chain: ChainKey;
  hash: string;
  from: string;
  to: string;
  valueWei: string;       // raw wei value as string
  valueNative: number;    // converted to native (e.g. 1.5 ETH)
  valueUsd: number | null;
  timestamp: string;      // ISO
  direction: 'in' | 'out' | 'self';
  methodId?: string;
  explorerUrl: string;
}

export interface WalletReport {
  address: string;
  /** Sum of all native + token USD values across all chains */
  netWorthUsd: number;
  /** Native balances by chain */
  natives: NativeBalance[];
  /** ERC-20 tokens with positive balances across chains */
  tokens: TokenHolding[];
  /** Most-recent N transactions across all chains, time-sorted desc */
  recentActivity: ChainActivity[];
  /** Per-chain summary (txn count, last active timestamp) */
  perChain: Array<{
    chain: ChainKey;
    nativeUsd: number;
    tokensUsd: number;
    totalUsd: number;
    txCount: number;
    lastActive: string | null;
  }>;
  /** Fetch errors keyed by chain — UI surfaces these as soft warnings */
  errors: Record<string, string>;
  /** When the report was assembled */
  fetchedAt: string;
}
