export interface UserEntitlementFields {
  premiumExpiresAt: string | null;
  eliteExpiresAt: string | null;
}

export interface Entitlements {
  premiumActive: boolean;
  premiumExpiresAt: Date | null;
  eliteActive: boolean;
  eliteExpiresAt: Date | null;
}

export function computeEntitlements(user: UserEntitlementFields | null): Entitlements {
  const now = new Date();
  const premiumExpiresAt = user?.premiumExpiresAt ? new Date(user.premiumExpiresAt) : null;
  const eliteExpiresAt = user?.eliteExpiresAt ? new Date(user.eliteExpiresAt) : null;
  return {
    premiumActive: premiumExpiresAt !== null && premiumExpiresAt > now,
    premiumExpiresAt,
    eliteActive: eliteExpiresAt !== null && eliteExpiresAt > now,
    eliteExpiresAt,
  };
}

export function walletTrackLimit(ent: Entitlements): number {
  return ent.premiumActive || ent.eliteActive ? 50 : 3;
}

/** Returns null for unlimited (Elite), otherwise the rolling-24h cap. */
export function consoleMessageLimit(ent: Entitlements): number | null {
  if (ent.eliteActive) return null;
  if (ent.premiumActive) return 100;
  return 10;
}

export const CONSOLE_WINDOW_HOURS = 24;

export interface PlanDef {
  id: 'free' | 'premium' | 'elite';
  name: string;
  price: string;
  period: string;
  bullets: string[];
}

export const PLAN_CATALOG: PlanDef[] = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    period: 'forever',
    bullets: [
      '10 messages / 24h (console + explorer)',
      'Track up to 3 wallets',
      'Rule-based portfolio insight chips',
      'Full Intelligence Console access',
      'Multichain Wallet Explorer',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₹4,150',
    period: '6 months',
    bullets: [
      '100 messages / 24h (console + explorer)',
      'Track up to 50 wallets',
      'AI-powered portfolio insight narrative',
      'Everything in Free',
    ],
  },
  {
    id: 'elite',
    name: 'Elite — Insider Bot',
    price: '₹8,300',
    period: '4 months',
    bullets: [
      'Unlimited messages across all surfaces',
      'Insider Bot — proactive smart-money alerts',
      'Natural language on-chain queries',
      'Whale & large-flow alert feed',
      'Invite-code access for select comp members',
      'Everything in Free',
    ],
  },
];
