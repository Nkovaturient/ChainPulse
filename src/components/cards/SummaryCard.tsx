'use client';

import type { Language } from '@/types';
import { t } from '@/lib/translations';
import MarkdownBody from '@/components/MarkdownBody';
import GlassPanel from '@/components/ui/GlassPanel';

interface Props {
  summary: string;
  lang: Language;
}

export default function SummaryCard({ summary, lang }: Props) {
  const tr = t(lang);
  if (!summary) return null;
  return (
    <GlassPanel glow="purple" className="card-enter rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-5 h-5 rounded-lg flex items-center justify-center text-[11px]"
          style={{ background: 'rgba(99,102,241,.2)' }}
        >
          ✦
        </div>
        <span className="text-xs font-semibold" style={{ color: 'var(--text-read)' }}>
          {tr.summary_label}
        </span>
      </div>
      <MarkdownBody>{summary}</MarkdownBody>
      <p className="mt-3 text-[11px]" style={{ color: 'var(--text-muted-read)' }}>
        {tr.not_financial_advice}
      </p>
    </GlassPanel>
  );
}
