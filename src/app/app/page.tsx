'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import QueryInput from '@/components/QueryInput';
import ChatThread from '@/components/ChatThread';
import Sidebar from '@/components/Sidebar';
import SkeletonCard from '@/components/SkeletonCard';
import { t } from '@/lib/translations';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ChatProvider, useChat } from '@/contexts/ChatContext';
import type { Language } from '@/types';

function AppPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const { sendMessage, newSession, activeSessionId } = useChat();

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
    <div className="h-screen flex overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* ── Sidebar ── */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── App Header ── */}
        <header className="app-header flex-shrink-0 z-20 px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* Sidebar collapse/expand toggle */}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="w-8 h-8 rounded-xl flex items-center justify-center border transition-all hover:opacity-80"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card2)', color: 'var(--text-muted)' }}
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? (
                /* Panel-collapse icon: sidebar lines + left arrow */
                <svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="1" width="14" height="12" rx="2" />
                  <line x1="5" y1="1" x2="5" y2="13" />
                  <polyline points="9,5 7,7 9,9" />
                </svg>
              ) : (
                /* Panel-expand icon: sidebar lines + right arrow */
                <svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="1" width="14" height="12" rx="2" />
                  <line x1="5" y1="1" x2="5" y2="13" />
                  <polyline points="7,5 9,7 7,9" />
                </svg>
              )}
            </button>

            {/* <button onClick={() => router.push('/')} className="flex items-center gap-1.5 group">
              <span className="text-xl">⛓</span>
              <span className="font-bold tracking-tight text-sm hidden sm:block" style={{ color: 'var(--text)' }}>
                ChainPulse
              </span>
            </button> */}


          </div>

          {/* Trust badge */}
          <div
            className="hidden sm:block text-[11px] px-3 py-1 rounded-full border"
            style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}
          >
            {tr.trust_banner}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {user && (
              <button
                onClick={() => router.push('/dashboard')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all hover:opacity-80"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-card2)', color: 'var(--text-muted)' }}
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {user.username[0].toUpperCase()}
                </span>
                {user.username}
              </button>
            )}

            {/* Lang switcher */}
            <div className="flex items-center gap-1 rounded-xl border p-1" style={{ borderColor: 'var(--border)', background: 'var(--bg-card2)' }}>
              {langs.map((l) => (
                <button key={l} onClick={() => setLang(l)}
                  className="px-2 py-0.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: lang === l ? 'var(--accent)' : 'transparent', color: lang === l ? '#fff' : 'var(--text-muted)' }}>
                  {langLabel(l)}
                </button>
              ))}
            </div>

            {/* Theme toggle */}
            <button onClick={toggle}
              className="w-8 h-8 rounded-xl flex items-center justify-center border transition-all hover:scale-105"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card2)', color: 'var(--text-muted)' }}
              title="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        {/* ── Chat area ── */}
        <main className="flex-1 flex flex-col min-h-0">
          {/* Message thread — scrolls independently */}
          <div className="flex-1 overflow-y-auto">
            <div className="w-full max-w-2xl mx-auto px-4 pb-4">
              <ChatThread lang={lang} />
            </div>
          </div>

          {/* Sticky query input */}
          <div
            className="sticky bottom-0 pb-4 pt-3"
            style={{ background: 'linear-gradient(to top, var(--bg) 70%, transparent)' }}
          >
            <div className="w-full max-w-2xl mx-auto px-4">
              {/* Active session indicator */}
              {activeSessionId && (
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    Session active · history on
                  </span>
                </div>
              )}
              <QueryInput
                lang={lang}
                query={query}
                setQuery={setQuery}
                onSubmit={handleSubmit}
                isLoading={isLoading}
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
