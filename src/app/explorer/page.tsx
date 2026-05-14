'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AddressInput from '@/components/explorer/AddressInput';
import WalletOverview from '@/components/explorer/WalletOverview';
import TokenList from '@/components/explorer/TokenList';
import TxTimeline from '@/components/explorer/TxTimeline';
import ExplorerChat from '@/components/explorer/ExplorerChat';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import type { WalletReport } from '@/lib/explorer/types';
import type { Language } from '@/types';

function ExplorerInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { theme, toggle } = useTheme();
  const { user } = useAuth();

  const [address, setAddress] = useState<string | null>(null);
  const [report, setReport] = useState<WalletReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lang: Language = 'en';

  const loadReport = useCallback(async (addr: string) => {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch(`/api/explorer/wallet/${addr}`);
      const data = (await res.json()) as WalletReport & { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to load wallet.');
        return;
      }
      setReport(data);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = useCallback((addr: string) => {
    setAddress(addr);
    // Reflect in URL so it's shareable
    router.replace(`/explorer?addr=${addr}`);
    void loadReport(addr);
  }, [loadReport, router]);

  // Hydrate from ?addr= on first render
  useEffect(() => {
    const q = params.get('addr');
    if (q && q !== address) {
      setAddress(q);
      void loadReport(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = () => {
    setAddress(null);
    setReport(null);
    setError(null);
    router.replace('/explorer');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="app-header flex-shrink-0 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/')} className="flex items-center gap-1.5">
            <span className="text-xl">⛓</span>
            <span className="font-bold tracking-tight text-sm hidden sm:block" style={{ color: 'var(--text)' }}>
              ChainPulse
            </span>
          </button>
          <span className="text-xs px-2 py-0.5 rounded-md font-mono"
            style={{ background: 'rgba(99,102,241,.15)', color: '#a5b4fc' }}>
            Explorer
          </span>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <button onClick={() => router.push('/dashboard')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all hover:opacity-80"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card2)', color: 'var(--text-muted)' }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {user.username[0].toUpperCase()}
              </span>
              {user.username}
            </button>
          )}
          <button onClick={() => router.push('/app')}
            className="px-3 py-1.5 rounded-xl text-xs border transition-all hover:opacity-80"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-card2)', color: 'var(--text-muted)' }}>
            Console
          </button>
          <button onClick={toggle}
            className="w-8 h-8 rounded-xl flex items-center justify-center border transition-all hover:scale-105"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-card2)', color: 'var(--text-muted)' }}
            title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Hero */}
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--text)' }}>
              Multichain wallet <span className="gradient-text">explorer</span>
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Inspect any EVM wallet across 7 chains — no wallet connection, no extension. Read-only on-chain truth.
            </p>
          </div>

          {/* Address input */}
          <AddressInput onSubmit={handleSubmit} initial={address ?? ''} busy={loading} />

          {/* Status / error */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && !report && (
            <div className="space-y-3">
              <div className="rounded-2xl h-32 animate-pulse" style={{ background: 'var(--bg-card2)' }} />
              <div className="grid grid-cols-4 gap-2">
                {[0,1,2,3,4,5,6].map((i) => (
                  <div key={i} className="rounded-xl h-20 animate-pulse" style={{ background: 'var(--bg-card2)' }} />
                ))}
              </div>
              <div className="rounded-xl h-40 animate-pulse" style={{ background: 'var(--bg-card2)' }} />
            </div>
          )}

          {/* Report */}
          {report && (
            <>
              {Object.keys(report.errors).length > 0 && (
                <div className="rounded-xl border px-4 py-2 text-xs"
                  style={{ borderColor: 'rgba(245,158,11,.3)', background: 'rgba(245,158,11,.08)', color: '#fbbf24' }}>
                  ⚠ Partial data: {Object.keys(report.errors).length} chain(s) failed to load. Showing what we have.
                </div>
              )}
              <WalletOverview report={report} />
              <ExplorerChat address={report.address} lang={lang} />
              <TokenList tokens={report.tokens} limit={10} />
              <TxTimeline activity={report.recentActivity} />

              <div className="text-center pt-4">
                <button
                  onClick={handleReset}
                  className="text-xs underline hover:opacity-70"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Inspect a different address
                </button>
              </div>
            </>
          )}

          {/* Empty state */}
          {!address && !loading && !error && (
            <div className="rounded-2xl p-8 border text-center text-sm space-y-2"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              <p className="text-2xl mb-3">🔍</p>
              <p className="font-semibold" style={{ color: 'var(--text)' }}>How it works</p>
              <p>Paste any EVM wallet address. We fetch its native + ERC-20 balances and recent transactions across Ethereum, Base, Arbitrum, Optimism, Polygon, BSC, and Avalanche — in parallel.</p>
              <p>Then ask anything about it. The agent uses live on-chain tools to answer — no guessing, no hallucination.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="px-6 py-4 text-center text-[11px]" style={{ color: 'var(--text-muted)' }}>
        Data from Etherscan V2 + CoinGecko · Read-only · No wallet connection
      </footer>
    </div>
  );
}

function ExplorerFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <span className="w-8 h-8 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
    </div>
  );
}

export default function ExplorerPage() {
  return (
    <Suspense fallback={<ExplorerFallback />}>
      <ExplorerInner />
    </Suspense>
  );
}
