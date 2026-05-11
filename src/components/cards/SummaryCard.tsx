'use client';

import type { Language } from '@/types';
import { t } from '@/lib/translations';

interface Props {
  summary: string;
  lang: Language;
}

export default function SummaryCard({ summary, lang }: Props) {
  const tr = t(lang);
  if (!summary) return null;
  return (
    <div
      className="card-enter rounded-2xl p-5 border"
      style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,.1) 0%, rgba(139,92,246,.06) 100%)',
        borderColor: 'rgba(99,102,241,.2)',
        boxShadow: '0 0 0 1px rgba(99,102,241,.1)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-5 h-5 rounded-lg flex items-center justify-center text-[11px]"
          style={{ background: 'rgba(99,102,241,.2)' }}
        >
          ✦
        </div>
        <span className="text-xs font-semibold" style={{ color: 'rgba(165,180,252,.8)' }}>
          {tr.summary_label}
        </span>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text)' }}>
        {summary}
      </p>
      <p className="mt-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
        {tr.not_financial_advice}
      </p>
    </div>
  );
}
