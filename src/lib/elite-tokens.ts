export const ELITE_COLORS = {
  gold: '#facc15',
  goldDark: '#ca8a04',
  goldBorder: 'rgba(234,179,8,.35)',
  goldBg: 'rgba(234,179,8,.12)',
  goldGlow: 'rgba(202,138,4,.28)',
  purple: '#6366f1',
  purpleGlow: 'rgba(99,102,241,.22)',
} as const;

export const eliteCardStyle = {
  background: 'linear-gradient(160deg, rgba(234,179,8,.12) 0%, rgba(17,24,39,.6) 55%, rgba(161,161,170,.04) 100%)',
  borderColor: ELITE_COLORS.goldBorder,
} as const;

export const eliteWelcomeStyle = {
  background: 'linear-gradient(135deg, rgba(234,179,8,.14) 0%, rgba(99,102,241,.08) 100%)',
  borderColor: 'rgba(234,179,8,.25)',
} as const;

export const eliteCtaGradient = 'linear-gradient(135deg, #eab308, #ca8a04 55%, #a16207)';

export const eliteCardClass = 'plans-plan-card elite-dashboard-card';
export const eliteFeatureCardClass = 'plans-plan-card elite-feature-card';
