import type { LucideIcon } from 'lucide-react';
import { MessageSquare, Search, Zap } from 'lucide-react';

export type FeatureNavId = 'console' | 'explorer' | 'insider';

export interface FeatureNavItem {
  id: FeatureNavId;
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  eliteAccent?: boolean;
}

export const FEATURE_NAV_ITEMS: FeatureNavItem[] = [
  {
    id: 'console',
    href: '/app',
    label: 'Console',
    shortLabel: 'Console',
    icon: MessageSquare,
  },
  {
    id: 'explorer',
    href: '/explorer',
    label: 'Explorer',
    shortLabel: 'Explorer',
    icon: Search,
  },
  {
    id: 'insider',
    href: '/insider',
    label: 'Insider Bot',
    shortLabel: 'Insider',
    icon: Zap,
    eliteAccent: true,
  },
];

export function featureNavIdFromPath(pathname: string): FeatureNavId | null {
  if (pathname.startsWith('/app')) return 'console';
  if (pathname.startsWith('/explorer')) return 'explorer';
  if (pathname.startsWith('/insider')) return 'insider';
  return null;
}
