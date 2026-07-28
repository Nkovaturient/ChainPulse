'use client';

import type { InsiderEvidence } from '@/types';

interface Props {
  evidence?: InsiderEvidence | null;
}

export default function InsiderCitationBar({ evidence }: Props) {
  const citations = evidence?.citations ?? [];
  if (!citations.length) return null;

  return (
    <div className="mt-2 pt-2 border-t space-y-1.5" style={{ borderColor: 'rgba(234,179,8,.12)' }}>
      <div className="flex flex-wrap gap-1.5">
        {citations.map((c, i) => {
          const chip = (
            <span
              className="inline-flex items-center text-xs px-2 py-1 rounded-md font-mono"
              style={{
                background: 'rgba(234,179,8,.08)',
                border: '1px solid rgba(234,179,8,.15)',
                color: 'var(--text-muted)',
              }}
            >
              {c.label}
            </span>
          );
          if (c.url) {
            return (
              <a
                key={`${c.type}-${c.label}-${i}`}
                href={c.url}
                target="_blank"
                rel="noreferrer"
                className="hover:opacity-80 transition-opacity"
              >
                {chip}
              </a>
            );
          }
          return <span key={`${c.type}-${c.label}-${i}`}>{chip}</span>;
        })}
      </div>
      <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.75 }}>
        Based on {citations.length} live source{citations.length === 1 ? '' : 's'}
      </p>
    </div>
  );
}
