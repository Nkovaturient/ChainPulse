'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Lock, AlertTriangle, RefreshCw } from 'lucide-react';
import AtmosphereBackground from '@/components/ui/AtmosphereBackground';
import EliteAmbientCanvas from '@/components/ui/EliteAmbientCanvas';
import AppHeader from '@/components/layout/AppHeader';
import MultilineComposer from '@/components/composer/MultilineComposer';
import MarkdownBody from '@/components/MarkdownBody';
import { usePlansModal } from '@/contexts/PlansModalContext';

interface Alert {
  id: string;
  chain: string;
  kind: string;
  address: string;
  txHash: string;
  amountUsd: number | null;
  summary: string;
  sourceUrl: string | null;
  detectedAt: string;
}

interface Turn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  pending?: boolean;
}

export default function InsiderPage() {
  const router = useRouter();
  const { openPlansModal } = usePlansModal();

  const [access, setAccess] = useState<'loading' | 'locked' | 'granted'>('loading');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const counter = useRef(0);

  const loadAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const res = await fetch('/api/insider/alerts');
      if (res.status === 403) { setAccess('locked'); return; }
      if (res.ok) {
        const data = (await res.json()) as { alerts: Alert[] };
        setAlerts(data.alerts);
        setAccess('granted');
      }
    } catch {
      // ignore
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns]);

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
      await loadAlerts();
    } catch {
      setRedeemError('Network error. Please try again.');
    } finally {
      setRedeemLoading(false);
    }
  };

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    const id = `t-${++counter.current}`;
    setTurns((prev) => [
      ...prev,
      { id, role: 'user', text },
      { id: `${id}-p`, role: 'assistant', text: '…', pending: true },
    ]);
    setInput('');
    setBusy(true);
    try {
      const history = turns.slice(-4).map((t) => ({ role: t.role, text: t.text }));
      const res = await fetch('/api/insider/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, language: 'en', history }),
      });
      const data = (await res.json()) as { summary?: string; error?: string };
      setTurns((prev) =>
        prev.filter((t) => t.id !== `${id}-p`).concat({
          id: `${id}-r`,
          role: 'assistant',
          text: res.ok ? (data.summary ?? '(no response)') : (data.error ?? 'Request failed.'),
        }),
      );
    } catch {
      setTurns((prev) =>
        prev.filter((t) => t.id !== `${id}-p`).concat({
          id: `${id}-e`, role: 'assistant', text: 'Network error.',
        }),
      );
    } finally {
      setBusy(false);
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
          <span className="text-xs px-2 py-0.5 rounded-md font-mono flex items-center gap-1.5"
            style={{ background: 'rgba(234,179,8,.12)', color: '#facc15' }}>
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
              {['Whale & large-flow alert feed', 'Proactive on-chain pattern signals', 'NL queries powered by Sonnet', 'Unlimited messages'].map((b) => (
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
              Get Elite access — ₹8,300 / 4 months
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
    <div className="h-screen flex flex-col relative overflow-hidden insider-shell">
      <AtmosphereBackground variant="insider" />
      <EliteAmbientCanvas />

      <AppHeader surface="insider" />

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-0 relative z-10 insider-shell__main">
        {/* Alerts feed */}
        <div className="flex flex-col border-r min-h-0" style={{ borderColor: 'rgba(234,179,8,.12)' }}>
          <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
            style={{ borderColor: 'rgba(234,179,8,.12)' }}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-yellow-400" />
              <span className="text-xs font-semibold" style={{ color: '#facc15' }}>Live Alerts</span>
            </div>
            <button
              onClick={() => void loadAlerts()}
              disabled={alertsLoading}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-70 disabled:opacity-40"
              style={{ background: 'rgba(234,179,8,.08)', color: '#facc15' }}
              title="Refresh alerts"
            >
              <RefreshCw size={12} className={alertsLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {alerts.length === 0 && !alertsLoading && (
              <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                No alerts yet. The scanner runs on its configured interval.
              </p>
            )}
            {alerts.map((alert) => (
              <div key={alert.id} className="rounded-xl p-3 border text-xs space-y-1.5"
                style={{ background: 'rgba(234,179,8,.04)', borderColor: 'rgba(234,179,8,.12)' }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono uppercase text-[10px] px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(234,179,8,.12)', color: '#facc15' }}>
                    {alert.chain}
                  </span>
                  <span style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                    {new Date(alert.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ color: 'var(--text)' }}>{alert.summary}</p>
                {alert.amountUsd && (
                  <p className="font-semibold" style={{ color: '#facc15' }}>
                    ~${(alert.amountUsd / 1000).toFixed(0)}K
                  </p>
                )}
                {alert.sourceUrl && (
                  <a href={alert.sourceUrl} target="_blank" rel="noreferrer"
                    className="underline opacity-50 hover:opacity-100 font-mono text-[10px]"
                    style={{ color: 'var(--text-muted)' }}>
                    {alert.txHash.slice(0, 14)}…
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* NL Chat */}
        <div className="flex flex-col min-h-0">
          <div className="px-5 py-3 border-b flex-shrink-0"
            style={{ borderColor: 'rgba(234,179,8,.12)' }}>
            <p className="text-xs font-semibold" style={{ color: '#facc15' }}>Ask Insider Bot</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Which wallets bought before the last pump? What are whales accumulating?
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {turns.length === 0 && (
              <div className="flex flex-col gap-2 pt-4">
                {[
                  'Which wallets are accumulating ETH right now?',
                  "What's the biggest flow in the last hour?",
                  'Any unusual gas spikes on Ethereum?',
                ].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="text-left text-xs px-3 py-2.5 rounded-xl border transition-all hover:opacity-80"
                    style={{ background: 'rgba(234,179,8,.04)', borderColor: 'rgba(234,179,8,.12)', color: 'var(--text-muted)' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {turns.map((t) =>
              t.role === 'user' ? (
                <div key={t.id} className="flex justify-end">
                  <div className="max-w-[80%] px-3 py-2 rounded-xl rounded-tr-sm text-xs"
                    style={{ background: 'rgba(234,179,8,.12)', color: '#facc15', border: '1px solid rgba(234,179,8,.2)' }}>
                    {t.text}
                  </div>
                </div>
              ) : (
                <div key={t.id} className="flex justify-start">
                  {t.pending ? (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl rounded-tl-sm glass-read">
                      {[0, 150, 300].map((d) => (
                        <span key={d} className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce"
                          style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  ) : (
                    <div className="max-w-full px-3 py-2.5 rounded-xl rounded-tl-sm text-xs glass-read">
                      <MarkdownBody className="text-xs">{t.text}</MarkdownBody>
                    </div>
                  )}
                </div>
              )
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-4 border-t flex-shrink-0" style={{ borderColor: 'rgba(234,179,8,.12)' }}>
            <MultilineComposer
              value={input}
              onChange={setInput}
              onSubmit={() => void send(input)}
              placeholder="Ask anything about smart-money flows…"
              submitLabel="Send"
              isLoading={busy}
              variant="insider"
              rows={1}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
