'use client';

import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

export type AppSurface = 'console' | 'explorer' | 'insider' | 'dashboard';

interface LegacyAppHeaderProps {
  surface: AppSurface;
  showSidebarToggle?: boolean;
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
  trustBanner?: string;
  extraControls?: React.ReactNode;
  onSignOut?: () => void;
}

function SidebarToggleButton({
  sidebarOpen,
  onSidebarToggle,
}: {
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
}) {
  return (
    <button
      onClick={onSidebarToggle}
      className="w-8 h-8 rounded-xl flex items-center justify-center glass-panel transition-all hover:opacity-80"
      style={{ color: 'var(--text-muted)' }}
      title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
    >
      {sidebarOpen ? (
        <svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="1" width="14" height="12" rx="2" />
          <line x1="5" y1="1" x2="5" y2="13" />
          <polyline points="9,5 7,7 9,9" />
        </svg>
      ) : (
        <svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="1" width="14" height="12" rx="2" />
          <line x1="5" y1="1" x2="5" y2="13" />
          <polyline points="7,5 9,7 7,9" />
        </svg>
      )}
    </button>
  );
}

function ThemeToggleButton() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="w-8 h-8 rounded-xl flex items-center justify-center glass-panel transition-all hover:scale-105"
      style={{ color: 'var(--text-muted)' }}
      title="Toggle theme"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}

function UserPill({ onClick }: { onClick: () => void }) {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <button
      onClick={onClick}
      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-panel text-xs font-medium transition-all hover:opacity-80"
      style={{ color: 'var(--text-muted)' }}
    >
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
      >
        {user.username[0].toUpperCase()}
      </span>
      {user.username}
    </button>
  );
}

export default function LegacyAppHeader({
  surface,
  showSidebarToggle,
  sidebarOpen,
  onSidebarToggle,
  trustBanner,
  extraControls,
  onSignOut,
}: LegacyAppHeaderProps) {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
      return;
    }
    void logout();
  };

  if (surface === 'dashboard') {
    return (
      <>
        <button onClick={() => router.push('/')} className="flex items-center gap-2">
          <span className="text-xl">⛓</span>
          <span className="font-bold text-sm hidden sm:block" style={{ color: 'var(--text)' }}>ChainPulse</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="w-8 h-8 rounded-xl flex items-center justify-center border"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-card2)', color: 'var(--text-muted)' }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            onClick={handleSignOut}
            className="text-xs px-3 py-1.5 rounded-xl border transition-colors hover:opacity-80"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--bg-card2)' }}
          >
            Sign out
          </button>
        </div>
      </>
    );
  }

  if (surface === 'console') {
    return (
      <>
        <div className="flex items-center gap-2">
          {showSidebarToggle && (
            <SidebarToggleButton sidebarOpen={sidebarOpen} onSidebarToggle={onSidebarToggle} />
          )}
        </div>
        {trustBanner && (
          <div
            className="hidden sm:block text-[11px] px-3 py-1 rounded-full glass-panel"
            style={{ color: 'var(--text-muted)' }}
          >
            {trustBanner}
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/explorer')}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl glass-panel text-xs font-medium transition-all hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
            title="Wallet Explorer"
          >
            🔍 Explorer
          </button>
          <button
            onClick={() => router.push('/insider')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:opacity-80"
            style={{ background: 'rgba(234,179,8,.1)', color: '#facc15', border: '1px solid rgba(234,179,8,.2)' }}
            title="Insider Bot"
          >
            ⚡ Insider
          </button>
          {user && <UserPill onClick={() => router.push('/dashboard')} />}
          {extraControls}
          <ThemeToggleButton />
        </div>
      </>
    );
  }

  if (surface === 'explorer') {
    return (
      <>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/')} className="flex items-center gap-1.5">
            <span className="text-xl">⛓</span>
            <span className="font-bold tracking-tight text-sm hidden sm:block" style={{ color: 'var(--text)' }}>
              ChainPulse
            </span>
          </button>
          <span
            className="text-xs px-2 py-0.5 rounded-md font-mono"
            style={{ background: 'rgba(99,102,241,.15)', color: '#a5b4fc' }}
          >
            Explorer
          </span>
        </div>
        <div className="flex items-center gap-2">
          {user && <UserPill onClick={() => router.push('/dashboard')} />}
          <button
            onClick={() => router.push('/app')}
            className="px-3 py-1.5 rounded-xl text-xs glass-panel transition-all hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
          >
            Console
          </button>
          <ThemeToggleButton />
        </div>
      </>
    );
  }

  // insider (legacy granted header — only used if not elite)
  return (
    <>
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/app')} className="flex items-center gap-2">
          <span className="text-xl">⛓</span>
          <span className="font-bold text-sm hidden sm:block" style={{ color: 'var(--text)' }}>ChainPulse</span>
        </button>
        <span
          className="text-xs px-2 py-0.5 rounded-md font-mono flex items-center gap-1.5"
          style={{ background: 'rgba(234,179,8,.12)', color: '#facc15' }}
        >
          <Zap size={11} /> Insider
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        {user?.username && <span className="hidden sm:block">{user.username}</span>}
        <button
          onClick={() => router.push('/dashboard')}
          className="px-3 py-1.5 rounded-xl glass-panel transition-all hover:opacity-80 text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          Dashboard
        </button>
      </div>
    </>
  );
}

export { ThemeToggleButton, UserPill };
