'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

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

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { theme, toggle } = useTheme();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const role = user?.role ? ROLE_META[user.role] : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="app-header sticky top-0 z-50 px-5 py-3 flex items-center justify-between gap-4">
        <button onClick={() => router.push('/')} className="flex items-center gap-2">
          <span className="text-xl">⛓</span>
          <span className="font-bold text-sm hidden sm:block" style={{ color: 'var(--text)' }}>ChainPulse</span>
        </button>

        <div className="flex items-center gap-2">
          <button onClick={toggle}
            className="w-8 h-8 rounded-xl flex items-center justify-center border"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-card2)', color: 'var(--text-muted)' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={logout}
            className="text-xs px-3 py-1.5 rounded-xl border transition-colors hover:opacity-80"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--bg-card2)' }}>
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 space-y-6">
        {/* Welcome card */}
        <div
          className="card-enter rounded-2xl p-6 border relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,.12) 0%, rgba(139,92,246,.08) 100%)',
            borderColor: 'rgba(99,102,241,.2)',
          }}
        >
          <div className="pointer-events-none absolute right-0 top-0 w-48 h-48 opacity-5"
            style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'rgba(165,180,252,.7)' }}>
                Welcome back
              </p>
              <h1 className="text-2xl font-bold text-white mb-2">
                {user?.username ?? 'Anon'} 👋
              </h1>
              <p className="text-sm" style={{ color: '#8892a4' }}>{user?.email}</p>
            </div>
            {role && (
              <span
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0"
                style={{ background: role.bg, color: role.color }}
              >
                {role.icon} {role.label}
              </span>
            )}
          </div>
          <div className="mt-5 pt-5 border-t border-white/8">
            <p className="text-xs" style={{ color: '#8892a4' }}>
              Member since{' '}
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : '—'}
            </p>
          </div>
        </div>

        {/* Primary CTAs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border)',
            }}
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
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            Quick actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => router.push(`/app?q=${encodeURIComponent(a.query)}`)}
                className="card flex items-center gap-3 p-4 rounded-xl text-left transition-all hover:scale-[1.02] hover:shadow-lg"
              >
                <span className="text-xl flex-shrink-0">{a.icon}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{a.label}</span>
                <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>→</span>
              </button>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
