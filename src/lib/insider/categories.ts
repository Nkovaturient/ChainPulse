import type { InsiderCategory } from '@/types';

export const INSIDER_CATEGORIES = [
  'all',
  'memecoin',
  'bluechip',
  'defi',
  'ai',
  'other',
] as const;

export type InsiderCategoryFilter = (typeof INSIDER_CATEGORIES)[number];

export const INSIDER_CATEGORY_LABELS: Record<InsiderCategoryFilter, string> = {
  all: 'All',
  memecoin: 'Memecoins',
  bluechip: 'Blue-chip',
  defi: 'DeFi',
  ai: 'AI',
  other: 'Other',
};

export function isInsiderCategoryFilter(value: string): value is InsiderCategoryFilter {
  return (INSIDER_CATEGORIES as readonly string[]).includes(value);
}

export function categoryHintPrompts(category: InsiderCategoryFilter): string[] {
  switch (category) {
    case 'memecoin':
      return [
        'Any new pools with smart-money inflows?',
        'Which memecoins are trending right now?',
        'Large DEX liquidity adds on Solana?',
      ];
    case 'bluechip':
      return [
        'Whale accumulation on ETH/BTC right now?',
        'Any large exchange inflows for majors?',
        'Biggest blue-chip flow in the last hour?',
      ];
    case 'defi':
      return [
        'Largest TVL adds in the last hour?',
        'Any unusual DeFi protocol inflows?',
        'Top yield pool movements today?',
      ];
    case 'ai':
      return [
        'Smart-money flows into AI tokens?',
        'Any large AI sector wallet activity?',
        'Which AI tokens saw whale buys today?',
      ];
    case 'other':
      return [
        'Any unusual gas spikes on Ethereum?',
        'Recent deployer wallet activity?',
        'Token unlocks coming this week?',
      ];
    default:
      return [
        'Which wallets are accumulating ETH right now?',
        "What's the biggest flow in the last hour?",
        'Any unusual gas spikes on Ethereum?',
      ];
  }
}

export function categorySystemNote(category: InsiderCategoryFilter): string {
  if (category === 'all') return '';
  return `\nACTIVE CATEGORY FILTER: ${category}. Prioritize alerts and tool calls relevant to this sector. If data is sparse for this category, say so explicitly.`;
}

export function inferCategoryFromKind(
  kind: string,
  metadata?: Record<string, unknown> | null,
): InsiderCategory {
  const metaCategory = metadata?.category;
  if (typeof metaCategory === 'string' && metaCategory !== 'other') {
    return metaCategory as InsiderCategory;
  }
  switch (kind) {
    case 'memecoin_momentum':
    case 'deployer_activity':
      return 'memecoin';
    case 'dex_liquidity':
    case 'token_unlock':
      return 'defi';
    case 'whale_tx': {
      const symbol = String(metadata?.symbol ?? '').toUpperCase();
      if (['BTC', 'ETH', 'SOL', 'BNB'].includes(symbol)) return 'bluechip';
      if (symbol.includes('AI') || symbol === 'FET' || symbol === 'RNDR') return 'ai';
      return 'other';
    }
    case 'unusual_gas':
      return 'other';
    default:
      return 'other';
  }
}
