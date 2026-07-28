'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Lock, AlertTriangle, RefreshCw } from 'lucide-react';
import AtmosphereBackground from '@/components/ui/AtmosphereBackground';
import EliteAmbientCanvas from '@/components/ui/EliteAmbientCanvas';
import AppHeader from '@/components/layout/AppHeader';
import InsiderChatPane from '@/components/insider/InsiderChatPane';
import InsiderCategoryChips from '@/components/insider/InsiderCategoryChips';
import InsiderAlertToast from '@/components/insider/InsiderAlertToast';
import { InsiderChatProvider } from '@/contexts/InsiderChatContext';
import { InsiderCategoryProvider, useInsiderCategory } from '@/contexts/InsiderCategoryContext';
import { usePlansModal } from '@/contexts/PlansModalContext';
import { INSIDER_CATEGORY_LABELS } from '@/lib/insider/categories';

interface Alert {
  id: string;
  chain: string;
  kind: string;
  category: string;
  address: string;
  txHash: string;
  amountUsd: number | null;
  summary: string;
  sourceUrl: string | null;
  detectedAt: string;
}

const POLL_MS = 45_000;

function InsiderAlertsSidebar() {
  const { category, setCategory } = useInsiderCategory();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const knownIds = useRef<Set<string>>(new Set());
  const initialLoad = useRef(true);

  const loadAlerts = useCallback(async (silent = false) => {
    if (!silent) setAlertsLoading(true);
    try {
      const qs = category !== 'all' ? `?category=${category}` : '';
      const res = await fetch(`/api/insider/alerts${qs}`);
      if (!res.ok) return;
      const data = (await res.json()) as { alerts: Alert[] };
      const incoming = data.alerts;

      if (!initialLoad.current) {
        const newOnes = incoming.filter((a) => !knownIds.current.has(a.id));
        if (newOnes.length > 0) {
          const label = category === 'all' ? 'signal' : INSIDER_CATEGORY_LABELS[category].toLowerCase();
          setToastMessage(
            `${newOnes.length} new ${label}${newOnes.length === 1 ? '' : 's'}`,
          );
        }
      } else {
        initialLoad.current = false;
      }

      knownIds.current = new Set(incoming.map((a) => a.id));
      setAlerts(incoming);
      setLastUpdated(new Date());
    } catch {
      // ignore
    } finally {
      if (!silent) setAlertsLoading(false);
    }
  }, [category]);

  useEffect(() => {
    initialLoad.current = true;
    knownIds.current = new Set();
    void loadAlerts();
  }, [loadAlerts]);

  useEffect(() => {
    const timer = setInterval(() => void loadAlerts(true), POLL_MS);
    return () => clearInterval(timer);
  }, [loadAlerts]);

  return (
    <>
      <div
        className="insider-alerts-sidebar flex flex-col border-b lg:border-b-0 lg:border-r min-h-0 max-h-[38vh] lg:max-h-none lg:w-[min(380px,36%)] lg:max-w-[420px] lg:flex-shrink-0"
        style={{ borderColor: 'rgba(234,179,8,.12)' }}
      >
        <div className="px-4 py-2.5 border-b flex-shrink-0" style={{ borderColor: 'rgba(234,179,8,.08)' }}>
          <InsiderCategoryChips value={category} onChange={setCategory} />
        </div>

        <div
          className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
          style={{ borderColor: 'rgba(234,179,8,.12)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-base font-semibold block" style={{ color: '#fde047' }}>
                Live Alerts
              </span>
              {lastUpdated && (
                <span className="text-xs block truncate" style={{ color: 'rgba(255,255,255,.65)' }}>
                  Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadAlerts()}
            disabled={alertsLoading}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80 hover:bg-yellow-400/15 disabled:opacity-40 flex-shrink-0"
            style={{ background: 'rgba(234,179,8,.12)', color: '#fde047' }}
            title="Refresh alerts"
          >
            <RefreshCw size={14} className={alertsLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
          {alerts.length === 0 && !alertsLoading && (
            <p className="text-sm text-center py-8 leading-relaxed" style={{ color: 'rgba(255,255,255,.55)' }}>
              No alerts yet for this category. Scanner runs every 15 min.
            </p>
          )}
          {alerts.map((alert) => (
            <div
              key={alert.id}
              role={alert.sourceUrl ? 'link' : undefined}
              tabIndex={alert.sourceUrl ? 0 : undefined}
              onClick={alert.sourceUrl ? () => window.open(alert.sourceUrl!, '_blank', 'noopener,noreferrer') : undefined}
              onKeyDown={
                alert.sourceUrl
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        window.open(alert.sourceUrl!, '_blank', 'noopener,noreferrer');
                      }
                    }
                  : undefined
              }
              className={[
                'insider-glow-card rounded-xl p-3.5 text-sm space-y-2',
                alert.sourceUrl ? 'cursor-pointer' : '',
              ].join(' ').trim()}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className="font-mono uppercase text-xs font-semibold px-2 py-0.5 rounded"
                    style={{ background: 'rgba(234,179,8,.2)', color: '#fde047' }}
                  >
                    {alert.chain}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded capitalize font-medium"
                    style={{ background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.85)' }}
                  >
                    {alert.kind.replace(/_/g, ' ')}
                  </span>
                </div>
                <span className="text-sm font-medium tabular-nums" style={{ color: 'rgba(255,255,255,.7)' }}>
                  {new Date(alert.detectedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,.92)' }}>
                {alert.summary}
              </p>
              {alert.amountUsd != null && alert.amountUsd > 0 && (
                <p className="text-sm font-bold" style={{ color: '#fde047' }}>
                  ~${alert.amountUsd >= 1_000_000
                    ? `${(alert.amountUsd / 1_000_000).toFixed(1)}M`
                    : `${(alert.amountUsd / 1000).toFixed(0)}K`}
                </p>
              )}
              {alert.sourceUrl && (
                <a
                  href={alert.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-sm font-medium underline-offset-2 transition-colors hover:text-yellow-300"
                  style={{ color: '#facc15' }}
                >
                  View source
                  {/* <span className="font-mono opacity-80">· {alert.txHash.slice(0, 12)}…</span> */}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      <InsiderAlertToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </>
  );
}

function InsiderWorkspace() {
  return (
    <div className="h-screen flex flex-col relative overflow-hidden insider-shell">
      <AtmosphereBackground variant="insider" />
      <EliteAmbientCanvas />
      <AppHeader surface="insider" />
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 relative z-10 overflow-hidden">
        <InsiderAlertsSidebar />
        <div className="flex-1 min-w-0 min-h-0 flex flex-col">
          <InsiderChatPane />
        </div>
      </main>
    </div>
  );
}

export default function InsiderPage() {
  const router = useRouter();
  const { openPlansModal } = usePlansModal();

  const [access, setAccess] = useState<'loading' | 'locked' | 'granted'>('loading');
  const [inviteCode, setInviteCode] = useState('');
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemLoading, setRedeemLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/insider/alerts');
        if (res.status === 403) {
          setAccess('locked');
          return;
        }
        if (res.ok) setAccess('granted');
      } catch {
        setAccess('locked');
      }
    })();
  }, []);

  const handleRedeem = async () => {
    const code = inviteCode.trim();
    if (!code) return;
    setRedeemLoading(true);
    setRedeemError(null);
    try {
      const res = await fetch('/api/insider/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setRedeemError(data.error ?? 'Redemption failed.');
        return;
      }
      setAccess('granted');
    } catch {
      setRedeemError('Network error. Please try again.');
    } finally {
      setRedeemLoading(false);
    }
  };

  if (access === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <span className="w-8 h-8 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (access === 'locked') {
    return (
      <div className="min-h-screen flex flex-col relative">
        <AtmosphereBackground variant="insider" />
        <header className="app-header flex-shrink-0 px-5 py-3 flex items-center justify-between relative z-20">
          <button onClick={() => router.push('/app')} className="flex items-center gap-2">
            <span className="text-xl">⛓</span>
            <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>ChainPulse</span>
          </button>
          <span
            className="text-xs px-2 py-0.5 rounded-md font-mono flex items-center gap-1.5"
            style={{ background: 'rgba(234,179,8,.12)', color: '#facc15' }}
          >
            <Zap size={11} /> Insider
          </span>
        </header>

        <main className="flex-1 flex items-center justify-center p-8 sm:p-12 relative z-10">
          <div
            className="insider-gate-card w-full max-w-lg rounded-[2rem] px-10 py-12 sm:px-12 sm:py-14 text-center space-y-8 border"
            style={{
              background: 'linear-gradient(165deg, rgba(22,28,45,.92) 0%, rgba(12,16,28,.95) 100%)',
              borderColor: 'rgba(234,179,8,.22)',
              backdropFilter: 'blur(24px)',
            }}
          >
            <div
              className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center transition-transform duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(234,179,8,.18), rgba(202,138,4,.08))',
                border: '1px solid rgba(234,179,8,.28)',
                boxShadow: '0 12px 32px rgba(202,138,4,.15)',
              }}
            >
              <Lock size={28} className="text-yellow-400" />
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Insider Bot</h1>
              <p className="text-sm sm:text-base leading-relaxed max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
                Smart-money alerts for Elite members. Proactive signals, not reactive queries.
              </p>
            </div>

            <div className="space-y-1 text-sm text-left max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
              {[
                'Whale & large-flow alert feed',
                'Proactive on-chain pattern signals',
                'NL queries powered by Sonnet',
                'Unlimited messages',
              ].map((b) => (
                <div key={b} className="insider-gate-feature flex items-center gap-3">
                  <Zap size={13} className="text-yellow-400 flex-shrink-0" />
                  {b}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => openPlansModal('insider_gate')}
              className="insider-gate-cta w-full py-4 rounded-2xl font-semibold text-base text-white"
              style={{
                background: 'linear-gradient(135deg, #eab308, #ca8a04 55%, #a16207)',
                boxShadow: '0 8px 28px rgba(202,138,4,.35)',
              }}
            >
              Get Elite access — ₹2,499 / 3 months
            </button>

            <div className="pt-4 border-t space-y-4" style={{ borderColor: 'rgba(255,255,255,.08)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                Have an invite code?
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="composer-shell flex-1 flex items-center">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && void handleRedeem()}
                    placeholder="Enter your code"
                    className="w-full px-4 py-3.5 text-sm bg-transparent border-none outline-none"
                    style={{ color: 'var(--text)' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void handleRedeem()}
                  disabled={redeemLoading || !inviteCode.trim()}
                  className="insider-gate-cta px-8 py-3.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                    boxShadow: '0 6px 20px rgba(99,102,241,.3)',
                  }}
                >
                  {redeemLoading ? 'Redeeming…' : 'Redeem'}
                </button>
              </div>
              {redeemError && (
                <p className="text-xs text-red-400 text-left">{redeemError}</p>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <InsiderCategoryProvider>
      <InsiderChatProvider>
        <InsiderWorkspace />
      </InsiderChatProvider>
    </InsiderCategoryProvider>
  );
}
