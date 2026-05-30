/**
 * Maps CoinGecko's free-form category strings onto a small set of display
 * buckets used by the Category Allocation chart. Pure, no network.
 */

export const CATEGORY_BUCKETS = [
  'AI',
  'DeFi',
  'RWA',
  'Meme',
  'Gaming',
  'Stablecoin',
  'Layer 1',
  'Layer 2',
  'Other',
] as const;

export type CategoryBucket = (typeof CATEGORY_BUCKETS)[number];

/** Ordered rules — first match wins, so put the most specific themes on top. */
const RULES: Array<[RegExp, CategoryBucket]> = [
  [/\b(ai|artificial intelligence|machine learning|agent)\b/i, 'AI'],
  [/\b(meme)\b/i, 'Meme'],
  [/\b(real world|rwa|tokenized asset|tokenization)\b/i, 'RWA'],
  [/\b(stablecoin|usd stable)\b/i, 'Stablecoin'],
  [/\b(gaming|gamefi|metaverse|play to earn|nft)\b/i, 'Gaming'],
  [/\b(decentralized finance|defi|dex|lending|yield|liquid staking|derivatives|perpetuals)\b/i, 'DeFi'],
  [/\b(layer 2|l2|rollup|scaling|optimistic|zk )\b/i, 'Layer 2'],
  [/\b(layer 1|l1|smart contract platform|proof of)\b/i, 'Layer 1'],
];

/** Pick a single display bucket from a list of CoinGecko categories. */
export function bucketFromCategories(categories: string[] | null | undefined): CategoryBucket {
  if (!categories?.length) return 'Other';
  for (const [rx, bucket] of RULES) {
    if (categories.some((c) => rx.test(c))) return bucket;
  }
  return 'Other';
}

/** Stable color per bucket for charts. */
export const CATEGORY_COLORS: Record<CategoryBucket, string> = {
  AI: '#6366f1',
  DeFi: '#22c55e',
  RWA: '#0ea5e9',
  Meme: '#ec4899',
  Gaming: '#f59e0b',
  Stablecoin: '#14b8a6',
  'Layer 1': '#8b5cf6',
  'Layer 2': '#38bdf8',
  Other: '#64748b',
};
