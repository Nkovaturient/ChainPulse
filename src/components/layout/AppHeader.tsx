'use client';

import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';
import { useBillingStatus } from '@/hooks/useBillingStatus';
import { useAuth } from '@/contexts/AuthContext';
import FeatureNav from '@/components/layout/FeatureNav';
import LegacyAppHeader, { ThemeToggleButton, type AppSurface } from '@/components/layout/LegacyAppHeader';

interface AppHeaderProps {
  surface: AppSurface;
  showSidebarToggle?: boolean;
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
  trustBanner?: string;
  extraControls?: React.ReactNode;
  onSignOut?: () => void;
  className?: string;
}

export default function AppHeader({
  surface,
  showSidebarToggle,
  sidebarOpen,
  onSidebarToggle,
  trustBanner,
  extraControls,
  onSignOut,
  className = '',
}: AppHeaderProps) {
  const router = useRouter();
  const { eliteActive } = useBillingStatus();
  const { user, logout } = useAuth();

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
      return;
    }
    void logout();
  };

  const headerClass = [
    'app-header flex-shrink-0 z-20 px-4 py-3 gap-4 relative',
    eliteActive ? 'app-header--elite' : 'flex items-center justify-between',
    surface === 'dashboard' ? 'sticky top-0 z-50 px-5' : '',
    className,
  ].filter(Boolean).join(' ');

  if (!eliteActive) {
    return (
      <header className={headerClass}>
        <LegacyAppHeader
          surface={surface}
          showSidebarToggle={showSidebarToggle}
          sidebarOpen={sidebarOpen}
          onSidebarToggle={onSidebarToggle}
          trustBanner={trustBanner}
          extraControls={extraControls}
          onSignOut={onSignOut}
        />
      </header>
    );
  }

  return (
    <header className={headerClass}>
      <div className="app-header__left flex items-center gap-2">
        {showSidebarToggle && surface === 'console' && (
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
        )}
        <button onClick={() => router.push(surface === 'dashboard' ? '/' : '/dashboard')} className="flex items-center gap-1.5">
          <span className="font-bold tracking-tight text-sm hidden sm:block" style={{ color: 'var(--text)' }}>
            ChainPulse
          </span>
        </button>
        <span
          className="hidden md:flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold"
          style={{ background: 'rgba(234,179,8,.12)', color: '#facc15', border: '1px solid rgba(234,179,8,.2)' }}
        >
          <Zap size={10} /> Elite
        </span>
      </div>

      <div className="app-header__center">
        <FeatureNav />
      </div>

      <div className="app-header__right flex items-center gap-2 justify-end">
        
        {user && surface !== 'dashboard' && (
          <button
            onClick={() => router.push('/dashboard')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass-panel text-xs font-medium transition-all hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#eab308,#ca8a04)' }}
            >
              {user.username[0].toUpperCase()}
            </span>
            <span className="hidden md:inline">{user.username}</span>
          </button>
        )}
        {extraControls}
        <ThemeToggleButton />
        {surface === 'dashboard' && (
          <button
            onClick={handleSignOut}
            className="text-xs px-3 py-1.5 rounded-xl border transition-colors hover:opacity-80"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--bg-card2)' }}
          >
            Sign out
          </button>
        )}
      </div>
    </header>
  );
}
