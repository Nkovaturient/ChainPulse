'use client';

import { useEffect, useRef } from 'react';
import { QUICK_CHIPS, t } from '@/lib/translations';
import { useTheme } from '@/contexts/ThemeContext';
import type { Language } from '@/types';

interface Props {
  lang: Language;
  query: string;
  setQuery: (q: string) => void;
  onSubmit: (q: string) => void;
  isLoading: boolean;
}

export default function QueryInput({ lang, query, setQuery, onSubmit, isLoading }: Props) {
  const tr = t(lang);
  const { theme } = useTheme();
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [query]);

  const submit = () => {
    const q = query.trim();
    if (q && !isLoading) onSubmit(q);
  };

  return (
    <div className="space-y-3">
      <div
        className="rounded-2xl border transition-all duration-200"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--bg-card)',
          boxShadow: 'var(--shadow)',
        }}
      >
        <textarea
          ref={taRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
          }}
          placeholder={tr.search_placeholder}
          rows={2}
          disabled={isLoading}
          className="w-full px-4 pt-4 pb-2 text-sm bg-transparent border-none outline-none placeholder:opacity-40 leading-relaxed"
          style={{ color: 'var(--text)', fontFamily: 'inherit' }}
        />
        <div className="flex items-center justify-between px-3 pb-3">
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            ⏎ Submit · Shift+⏎ Newline
          </span>
          <button
            onClick={submit}
            disabled={isLoading || !query.trim()}
            className="px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 flex items-center gap-2"
            style={{
              background: isLoading ? 'var(--border)' : 'var(--accent)',
              color: '#fff',
            }}
          >
            {isLoading ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {tr.loading}
              </>
            ) : (
              <>
                {tr.submit}
                <span className="text-base">→</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick chips */}
      <div className="flex flex-wrap gap-2">
        {QUICK_CHIPS[lang].map((chip) => (
          <button
            key={chip}
            onClick={() => { setQuery(chip); onSubmit(chip); }}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 rounded-full border transition-all duration-150 disabled:opacity-40 hover:scale-[1.03]"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-muted)',
            }}
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
