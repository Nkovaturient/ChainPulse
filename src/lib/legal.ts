import { PLAN_CATALOG } from '@/lib/tier';

export const LEGAL_OPERATOR = 'ChainPulse';
export const LEGAL_OPERATOR_NOTE =
  'ChainPulse is operated by an individual using the trade name ChainPulse. There is no registered company entity listed on this site.';
export const LEGAL_CONTACT_EMAIL = 'chainpulse7ech@gmail.com';
export const LEGAL_SITE_URL = 'https://www.chain-pulse.tech';
export const LEGAL_LAST_UPDATED = '14 October 2026';
export const LEGAL_GOVERNING_LAW = 'India';

export const LEGAL_FOOTER_LINKS = [
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/refund', label: 'Refunds' },
  // { href: '/shipping', label: 'Shipping' },
  { href: '/contact', label: 'Contact' },
] as const;

export const DATA_SOURCES = [
  'CoinGecko (prices and token metadata)',
  'DefiLlama (DeFi TVL and yields)',
  'Etherscan API v2 and Solscan (on-chain activity)',
  'Cointelegraph and Decrypt RSS (news headlines)',
] as const;

export const THIRD_PARTY_PROCESSORS = [
  'Supabase (Google OAuth sign-in)',
  'Razorpay (payments)',
  'Jotform (optional feedback form)',
  'Wispr Flow (optional voice input when enabled)',
  'Vercel (hosting)',
  'PostgreSQL database provider (account and usage data)',
  'Anthropic (AI responses for console, explorer, and insider features)',
] as const;

export function formatPlanPricingForLegal(): string {
  const paid = PLAN_CATALOG.filter((p) => p.id !== 'free');
  return paid
    .map((p) => `${p.name}: ${p.price} per ${p.period} (one-time purchase, INR)`)
    .join('; ');
}
