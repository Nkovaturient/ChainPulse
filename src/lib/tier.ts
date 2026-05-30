import type { UserTier } from '@prisma/client';

export const TRACK_LIMIT: Record<UserTier, number> = {
  free: 3,
  premium: 100,
};

export function trackLimitFor(tier: UserTier): number {
  return TRACK_LIMIT[tier];
}

export function isPremiumTier(tier: UserTier): boolean {
  return tier === 'premium';
}
