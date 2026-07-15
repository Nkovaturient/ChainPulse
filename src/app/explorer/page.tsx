'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AddressInput from '@/components/explorer/AddressInput';
import WalletOverview from '@/components/explorer/WalletOverview';
import AllocationCharts from '@/components/explorer/AllocationCharts';
import PerformanceChart from '@/components/explorer/PerformanceChart';
import PortfolioInsights from '@/components/explorer/PortfolioInsights';
import WalletTracker from '@/components/explorer/WalletTracker';
import TokenList from '@/components/explorer/TokenList';
import TxTimeline from '@/components/explorer/TxTimeline';
import ExplorerChat from '@/components/explorer/ExplorerChat';
import AtmosphereBackground from '@/components/ui/AtmosphereBackground';
import GlassDisc from '@/components/ui/GlassDisc';
import GlassPanel from '@/components/ui/GlassPanel';
import AppHeader from '@/components/layout/AppHeader';
import { CHAIN_COUNT, chainNamesBlurb } from '@/lib/explorer/chains';
import { computeEntitlements } from '@/lib/tier';
import { useAuth } from '@/contexts/AuthContext';
import type { WalletReport } from '@/lib/explorer/types';
import type { Language } from '@/types';

function ExplorerInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();

  const [address, setAddress] = useState<string | null>(null);
  const [report, setReport] = useState<WalletReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lang: Language = 'en';

  const loadReport = useCallback(async (addr: string, opts?: { keepVisible?: boolean }) => {
    setLoading(true);
    setError(null);
    if (!opts?.keepVisible) setReport(null);
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
    <div className="min-h-screen flex flex-col relative">
      <AtmosphereBackground variant="explorer" />

      <AppHeader surface="explorer" />

      <main className="flex-1 px-4 py-8 relative z-10">
        <GlassDisc visible={!address && !loading} />

        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-6 relative z-[2]">
          <div className="flex-1 min-w-0 space-y-6">
          {/* Hero */}
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--text)' }}>
              Multichain wallet <span className="gradient-text">explorer</span>
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Inspect any EVM wallet across {CHAIN_COUNT} chains — no wallet connection, no extension. Read-only on-chain truth.
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
              <WalletOverview
                report={report}
                onRefresh={() => address && void loadReport(address, { keepVisible: true })}
                refreshing={loading}
              />
              <AllocationCharts report={report} />
              <PerformanceChart report={report} />
              <PortfolioInsights report={report} premium={computeEntitlements(user).premiumActive} />
              <ExplorerChat address={report.address} lang={lang} />
              <TokenList tokens={report.tokens} limit={10} />
              <TxTimeline activity={report.recentActivity} />

              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs underline hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Inspect a different address
                </button>
              </div>
            </>
          )}

          {/* Empty state */}
          {!address && !loading && !error && (
            <GlassPanel className="rounded-2xl p-8 text-center text-sm space-y-2">
              <p className="text-2xl mb-3">🔍</p>
              <p className="font-semibold" style={{ color: 'var(--text)' }}>How it works</p>
              <p style={{ color: 'var(--text-muted)' }}>Paste any EVM wallet address. We fetch its native + ERC-20 balances and recent transactions across {chainNamesBlurb()} — in parallel.</p>
              <p style={{ color: 'var(--text-muted)' }}>Then ask anything about it. The agent uses live on-chain tools to answer — no guessing, no hallucination.</p>
            </GlassPanel>
          )}
          </div>

          <aside className="w-full lg:w-72 flex-shrink-0 space-y-4">
            <WalletTracker currentAddress={address} onInspect={handleSubmit} />
          </aside>
        </div>
      </main>

      <footer className="px-6 py-4 text-center text-[11px] relative z-10" style={{ color: 'var(--text-muted)' }}>
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
