'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QueryInput from '@/components/QueryInput';
import ResponseFeed from '@/components/ResponseFeed';
import SkeletonCard from '@/components/SkeletonCard';
import { t } from '@/lib/translations';
import { useTheme } from '@/contexts/ThemeContext';
import type { Language, QueryResponse } from '@/types';

export default function AppPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [query, setQuery] = useState('');
  const [lang, setLang] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (q: string) => {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, language: lang }),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || 'Request failed');
      }
      const data = (await res.json()) as QueryResponse;
      setResponse(data);
      if (data.language) setLang(data.language);
    } catch (e) {
      setError(e instanceof Error ? e.message : t(lang).error_generic);
    } finally {
      setIsLoading(false);
    }
  };

  const langs: Language[] = ['en', 'hi', 'bn'];
  const langLabel = (l: Language) => (l === 'en' ? 'EN' : l === 'hi' ? 'हि' : 'বা');
  const tr = t(lang);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* ── App Header ── */}
      <header className="app-header sticky top-0 z-50 px-4 py-3 flex items-center justify-between gap-4">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 group"
        >
          <span className="text-xl">⛓</span>
          <span
            className="font-bold tracking-tight text-sm hidden sm:block"
            style={{ color: 'var(--text)' }}
          >
            ChainPulse
          </span>
        </button>

        {/* Trust badge */}
        <div
          className="hidden sm:block text-[11px] px-3 py-1 rounded-full border"
          style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}
        >
          {tr.trust_banner}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Lang switcher */}
          <div
            className="flex items-center gap-1 rounded-xl border p-1"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-card2)' }}
          >
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

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="w-8 h-8 rounded-xl flex items-center justify-center border transition-all hover:scale-105"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-card2)', color: 'var(--text-muted)' }}
            title="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col">
        {/* Query zone */}
        <div className="w-full max-w-2xl mx-auto px-4 pt-8 pb-4">
          <QueryInput
            lang={lang}
            query={query}
            setQuery={setQuery}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>

        {/* Results */}
        <div className="w-full max-w-2xl mx-auto px-4 pb-16 space-y-4">
          {isLoading && (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}

          {error && !isLoading && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {!isLoading && response && <ResponseFeed response={response} lang={lang} />}

          {!isLoading && !response && !error && (
            <div className="text-center py-20">
              <div className="text-4xl mb-4">⛓</div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Ask about prices, whales, DeFi, staking, or news
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
