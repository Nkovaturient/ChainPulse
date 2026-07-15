'use client';

import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { Zap, Shield, Star, MessageSquare, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlansModal } from '@/contexts/PlansModalContext';
import { useBillingStatus } from '@/hooks/useBillingStatus';
import AppHeader from '@/components/layout/AppHeader';
import AtmosphereBackground from '@/components/ui/AtmosphereBackground';
import EliteAmbientCanvas from '@/components/ui/EliteAmbientCanvas';
import {
  eliteCardClass,
  eliteFeatureCardClass,
  eliteWelcomeStyle,
  eliteCardStyle,
} from '@/lib/elite-tokens';

const ROLE_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  student:         { label: 'Student',        icon: '🎓', color: '#a5b4fc', bg: 'rgba(99,102,241,.15)' },
  trader:          { label: 'Trader',         icon: '📊', color: '#34d399', bg: 'rgba(16,185,129,.12)' },
  crypto_investor: { label: 'Investor',       icon: '💼', color: '#fbbf24', bg: 'rgba(245,158,11,.12)' },
  just_exploring:  { label: 'Exploring',      icon: '🧭', color: '#67e8f9', bg: 'rgba(6,182,212,.12)' },
  tech_savvy:      { label: 'Tech / Builder', icon: '⚙️', color: '#c084fc', bg: 'rgba(139,92,246,.15)' },
};

const QUICK_ACTIONS = [
  { icon: '📈', label: 'BTC & ETH prices',     query: 'BTC price' },
  { icon: '🐳', label: 'Whale movements',       query: 'ETH whale activity' },
  { icon: '📰', label: 'Latest crypto news',    query: 'Crypto news today' },
  { icon: '🏦', label: 'Top DeFi protocols',    query: 'Top DeFi TVL' },
  { icon: '💎', label: 'Best staking yields',   query: 'Best staking yields' },
];

function formatExpiry(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function EliteFeatureCard({
  title,
  subtitle,
  icon,
  onClick,
  variant,
  delay,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant: 'console' | 'explorer' | 'insider';
  delay: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={[
        eliteFeatureCardClass,
        'rounded-2xl p-5 text-left flex items-center justify-between group border',
        variant === 'console' ? 'elite-feature-card--console' : '',
        variant === 'insider' ? 'elite-feature-card--insider' : '',
      ].filter(Boolean).join(' ')}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div>
        <div
          className="text-base font-bold mb-1 flex items-center gap-1.5"
          style={{ color: variant === 'console' ? '#fff' : variant === 'insider' ? '#facc15' : 'var(--text)' }}
        >
          {icon}
          {title}
        </div>
        <div className="text-xs" style={{ color: variant === 'console' ? 'rgba(255,255,255,.65)' : 'var(--text-muted)' }}>
          {subtitle}
        </div>
      </div>
      <span
        className="text-2xl group-hover:translate-x-1 transition-transform"
        style={{ color: variant === 'console' ? 'rgba(255,255,255,.8)' : 'var(--text-muted)' }}
      >
        →
      </span>
    </motion.button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { openPlansModal } = usePlansModal();
  const { status: billing, loading: billingLoading, eliteActive } = useBillingStatus();
  const reduceMotion = useReducedMotion();

  if (loading || billingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const role = user?.role ? ROLE_META[user.role] : null;
  const activePlan = billing?.eliteActive ? 'Elite' : billing?.premiumActive ? 'Premium' : 'Free';
  const activePlanColor = billing?.eliteActive ? '#facc15' : billing?.premiumActive ? '#a5b4fc' : 'var(--text-muted)';

  const fadeUp = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: eliteActive ? 'transparent' : 'var(--bg)' }}>
      {eliteActive && (
        <>
          <AtmosphereBackground variant="insider" />
          <EliteAmbientCanvas />
        </>
      )}

      <AppHeader surface="dashboard" onSignOut={() => void logout()} />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 space-y-6 relative z-10">
        <motion.div
          className={eliteActive ? `${eliteCardClass} card-enter rounded-2xl p-6 border relative overflow-hidden` : 'card-enter rounded-2xl p-6 border relative overflow-hidden'}
          style={eliteActive ? eliteWelcomeStyle : {
            background: 'linear-gradient(135deg, rgba(99,102,241,.12) 0%, rgba(139,92,246,.08) 100%)',
            borderColor: 'rgba(99,102,241,.2)',
          }}
          {...fadeUp(0)}
        >
          <div
            className="pointer-events-none absolute right-0 top-0 w-48 h-48 opacity-5"
            style={{ background: eliteActive ? 'radial-gradient(circle, #eab308, transparent)' : 'radial-gradient(circle, #6366f1, transparent)' }}
          />
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: eliteActive ? 'rgba(250,204,21,.8)' : 'rgba(165,180,252,.7)' }}>
                Welcome back
              </p>
              <h1 className="text-2xl font-bold text-white mb-2">
                {user?.username ?? 'Anon'} 👋
              </h1>
              <p className="text-sm" style={{ color: '#8892a4' }}>{user?.email}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {eliteActive && (
                <span
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(234,179,8,.15)', color: '#facc15', border: '1px solid rgba(234,179,8,.25)' }}
                >
                  <Zap size={11} /> Elite
                </span>
              )}
              {role && (
                <span
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: role.bg, color: role.color }}
                >
                  {role.icon} {role.label}
                </span>
              )}
            </div>
          </div>
          <div className="mt-5 pt-5 border-t border-white/8">
            <p className="text-xs" style={{ color: '#8892a4' }}>
              Member since{' '}
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : '—'}
            </p>
          </div>
        </motion.div>

        <motion.div
          className={eliteActive ? `${eliteCardClass} rounded-2xl p-5 border` : 'rounded-2xl p-5 border'}
          style={eliteActive ? eliteCardStyle : { background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          {...fadeUp(0.08)}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Your Plan</h2>
            <span
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: billing?.eliteActive ? 'rgba(234,179,8,.12)' : billing?.premiumActive ? 'rgba(99,102,241,.15)' : 'rgba(100,116,139,.12)',
                color: activePlanColor,
              }}
            >
              {billing?.eliteActive ? <Zap size={11} /> : billing?.premiumActive ? <Shield size={11} /> : <Star size={11} />}
              {activePlan}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl p-3 border" style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)' }}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#a5b4fc' }}>Premium</p>
              <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                {billing?.premiumActive ? `Active · expires ${formatExpiry(billing.premiumExpiresAt)}` : 'Not active'}
              </p>
            </div>
            <div className="rounded-xl p-3 border" style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)' }}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#facc15' }}>Elite</p>
              <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                {billing?.eliteActive ? `Active · expires ${formatExpiry(billing.eliteExpiresAt)}` : 'Not active'}
              </p>
            </div>
            <div className="rounded-xl p-3 border" style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)' }}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#34d399' }}>Messages today</p>
              <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                {billing?.quota.unlimited
                  ? 'Unlimited'
                  : `${billing?.quota.used ?? 0} / ${billing?.quota.limit ?? 10}`}
              </p>
            </div>
          </div>

          <button
            onClick={() => openPlansModal('manage')}
            className="text-xs px-4 py-2 rounded-xl font-semibold transition-all hover:opacity-80"
            style={{ background: 'rgba(99,102,241,.15)', color: '#a5b4fc' }}
          >
            View all plans & upgrade
          </button>
        </motion.div>

        {eliteActive ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <EliteFeatureCard
              title="Intelligence Console"
              subtitle="Ask anything about crypto"
              icon={<MessageSquare size={14} />}
              onClick={() => router.push('/app')}
              variant="console"
              delay={0.12}
            />
            <EliteFeatureCard
              title="Wallet Explorer"
              subtitle="Multichain wallet lookup + Q&A"
              icon={<Search size={14} />}
              onClick={() => router.push('/explorer')}
              variant="explorer"
              delay={0.16}
            />
            <EliteFeatureCard
              title="Insider Bot"
              subtitle="Smart-money alerts"
              icon={<Zap size={14} className="text-yellow-400" />}
              onClick={() => router.push('/insider')}
              variant="insider"
              delay={0.2}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => router.push('/app')}
              className="glow-btn rounded-2xl p-5 text-left flex items-center justify-between group transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 4px 24px rgba(99,102,241,.35)',
              }}
            >
              <div>
                <div className="text-base font-bold text-white mb-1">Intelligence Console</div>
                <div className="text-xs text-white/65">Ask anything about crypto</div>
              </div>
              <span className="text-2xl group-hover:translate-x-1 transition-transform text-white/80">→</span>
            </button>
            <button
              onClick={() => router.push('/explorer')}
              className="rounded-2xl p-5 text-left flex items-center justify-between group transition-all duration-300 border"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <div>
                <div className="text-base font-bold mb-1 flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                  🔍 Wallet Explorer
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Multichain wallet lookup + Q&A
                </div>
              </div>
              <span className="text-2xl group-hover:translate-x-1 transition-transform" style={{ color: 'var(--text-muted)' }}>→</span>
            </button>
            <button
              onClick={() => router.push('/insider')}
              className="rounded-2xl p-5 text-left flex items-center justify-between group transition-all duration-300 border"
              style={{
                background: billing?.eliteActive
                  ? 'linear-gradient(135deg, rgba(234,179,8,.1), rgba(161,161,170,.04))'
                  : 'var(--bg-card)',
                borderColor: billing?.eliteActive ? 'rgba(234,179,8,.3)' : 'var(--border)',
              }}
            >
              <div>
                <div className="text-base font-bold mb-1 flex items-center gap-1.5" style={{ color: billing?.eliteActive ? '#facc15' : 'var(--text)' }}>
                  <Zap size={14} className={billing?.eliteActive ? 'text-yellow-400' : ''} />
                  Insider Bot
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {billing?.eliteActive ? 'Smart-money alerts' : 'Elite members only'}
                </div>
              </div>
              <span className="text-2xl group-hover:translate-x-1 transition-transform" style={{ color: 'var(--text-muted)' }}>→</span>
            </button>
          </div>
        )}

        {/* <motion.div {...fadeUp(eliteActive ? 0.24 : 0)}>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            Quick actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => router.push(`/app?q=${encodeURIComponent(a.query)}`)}
                className={[
                  'card flex items-center gap-3 p-4 rounded-xl text-left transition-all hover:scale-[1.02] hover:shadow-lg',
                  eliteActive ? 'elite-quick-action' : '',
                ].filter(Boolean).join(' ')}
              >
                <span className="text-xl flex-shrink-0">{a.icon}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{a.label}</span>
                <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>→</span>
              </button>
            ))}
          </div>
        </motion.div> */}
      </main>
    </div>
  );
}
