'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import QueryInput from '@/components/QueryInput';
import ChatThread from '@/components/ChatThread';
import Sidebar from '@/components/Sidebar';
import SkeletonCard from '@/components/SkeletonCard';
import AtmosphereBackground from '@/components/ui/AtmosphereBackground';
import GlassDisc from '@/components/ui/GlassDisc';
import AppHeader from '@/components/layout/AppHeader';
import { t } from '@/lib/translations';
import { ChatProvider, useChat } from '@/contexts/ChatContext';
import { usePlansModal } from '@/contexts/PlansModalContext';
import type { Language } from '@/types';

function AppPageContent() {
  const params = useSearchParams();
  const { sendMessage, newSession, activeSessionId, messages, quota } = useChat();
  const { openPlansModal } = usePlansModal();

  const [query, setQuery] = useState('');
  const [lang, setLang] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const autoSubmittedForQ = useRef<string | null>(null);

  const handleSubmit = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setIsLoading(true);
    setQuery('');
    try {
      const result = await sendMessage(q, lang);
      if (result?.language) setLang(result.language);
    } finally {
      setIsLoading(false);
    }
  }, [lang, sendMessage]);

  // Auto-submit ?q= param from dashboard quick actions
  useEffect(() => {
    const q = params.get('q');
    if (!q || autoSubmittedForQ.current === q) return;
    autoSubmittedForQ.current = q;
    setQuery(q);
    void handleSubmit(q);
  }, [params, handleSubmit]);

  const langs: Language[] = ['en', 'hi', 'bn'];
  const langLabel = (l: Language) => (l === 'en' ? 'EN' : l === 'hi' ? 'हि' : 'বা');
  const tr = t(lang);

  return (
    <div className="h-screen flex overflow-hidden relative">
      <AtmosphereBackground variant="console" />

      {/* ── Sidebar ── */}
      <div className="relative z-20">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <AppHeader
          surface="console"
          showSidebarToggle
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen((v) => !v)}
          trustBanner={tr.trust_banner}
          extraControls={
            <div className="flex items-center gap-1 rounded-xl glass-panel p-1">
              {langs.map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className="px-2 py-0.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: lang === l ? 'var(--accent)' : 'transparent',
                    color: lang === l ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {langLabel(l)}
                </button>
              ))}
            </div>
          }
        />

        {/* ── Chat area ── */}
        <main className="flex-1 flex flex-col min-h-0 relative">
          <GlassDisc visible={messages.length === 0 && !isLoading} />

          {/* Message thread — scrolls independently */}
          <div className="flex-1 overflow-y-auto relative">
            <div className="w-full max-w-3xl mx-auto px-4 pb-4">
              <ChatThread lang={lang} onHintClick={handleSubmit} />
            </div>
          </div>

          {/* Sticky query input */}
          <div
            className="sticky bottom-0 pb-4 pt-3 relative z-[2] input-fade-gradient"
          >
            <div className="w-full max-w-3xl mx-auto px-4">
              {/* Quota banner */}
              {quota.blocked ? (
                <div className="mb-2 px-4 py-2.5 rounded-xl flex items-center justify-between gap-3 text-xs"
                  style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', color: '#fca5a5' }}>
                  <span>
                    Daily message limit reached.
                    {quota.resetAt && (
                      <span className="ml-1 opacity-70">
                        Resets {new Date(quota.resetAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => openPlansModal('console_limit')}
                    className="flex-shrink-0 font-semibold px-3 py-1 rounded-lg text-white"
                    style={{ background: '#6366f1' }}
                  >
                    Upgrade
                  </button>
                </div>
              ) : (
                activeSessionId && (
                  <div className="flex items-center gap-1.5 mb-2 px-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      Session active · history on
                    </span>
                  </div>
                )
              )}
              <QueryInput
                lang={lang}
                query={query}
                setQuery={setQuery}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                disabled={quota.blocked}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function AppPageFallback() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <header className="app-header sticky top-0 z-20 px-4 py-3 flex items-center justify-between gap-4">
        <span className="text-xl">⛓</span>
      </header>
      <main className="flex-1 flex flex-col px-4 pt-8 space-y-4 max-w-2xl mx-auto w-full">
        <SkeletonCard />
        <SkeletonCard />
      </main>
    </div>
  );
}

export default function AppPage() {
  return (
    <ChatProvider>
      <Suspense fallback={<AppPageFallback />}>
        <AppPageContent />
      </Suspense>
    </ChatProvider>
  );
}
