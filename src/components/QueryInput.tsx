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

    </div>
  );
}
