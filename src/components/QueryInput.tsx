'use client';

import { QUICK_CHIPS, t } from '@/lib/translations';
import MultilineComposer from '@/components/composer/MultilineComposer';
import type { Language } from '@/types';

interface Props {
  lang: Language;
  query: string;
  setQuery: (q: string) => void;
  onSubmit: (q: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function QueryInput({ lang, query, setQuery, onSubmit, isLoading, disabled = false }: Props) {
  const tr = t(lang);

  const submit = () => {
    const q = query.trim();
    if (q && !isLoading) onSubmit(q);
  };

  return (
    <div className="space-y-3">
      <MultilineComposer
        value={query}
        onChange={setQuery}
        onSubmit={submit}
        placeholder={tr.search_placeholder}
        submitLabel={tr.submit}
        loadingLabel={tr.loading}
        isLoading={isLoading}
        disabled={disabled}
      />

      <div className="flex flex-wrap gap-2 chip-stagger">
        {QUICK_CHIPS[lang].map((chip) => (
          <button
            key={chip}
            onClick={() => { setQuery(chip); onSubmit(chip); }}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 rounded-full glass-panel transition-all duration-150 disabled:opacity-40 hover:scale-[1.03]"
            style={{ color: 'var(--text-muted)' }}
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
