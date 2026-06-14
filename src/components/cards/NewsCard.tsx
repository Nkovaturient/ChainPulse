'use client';

import type { Language, NewsItem } from '@/types';
import { t } from '@/lib/translations';
import { relativeTime } from '@/lib/utils';

interface Props {
  data: NewsItem[];
  lang: Language;
}

export default function NewsCard({ data, lang }: Props) {
  const tr = t(lang);
  return (
    <div className="card-enter card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(6,182,212,.15)' }}>
            📰
          </div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{tr.news_card_title}</h3>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full glass-read-inner"
          style={{ color: 'var(--text-muted)' }}>RSS</span>
      </div>

      <div className="space-y-1">
        {data.map((n) => {
          const iso = n.pubDate ? new Date(n.pubDate).toISOString() : '';
          return (
            <a
              key={n.link}
              href={n.link}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-3 p-3 rounded-xl transition-all hover:scale-[1.01] group block glass-read-inner"
            >
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-medium leading-relaxed line-clamp-2 group-hover:underline underline-offset-2"
                  style={{ color: 'var(--text)' }}
                >
                  {n.title}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ background: 'var(--border)', color: 'var(--text-muted)' }}
                  >
                    {n.source}
                  </span>
                  {iso && (
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {relativeTime(iso)}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-sm flex-shrink-0 mt-0.5 opacity-30 group-hover:opacity-70 transition-opacity">
                ↗
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
