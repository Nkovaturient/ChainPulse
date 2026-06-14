'use client';

import type { Language, WhaleTransaction } from '@/types';
import { t } from '@/lib/translations';
import { relativeTime } from '@/lib/utils';

interface Props {
  data: WhaleTransaction[];
  lang: Language;
}

export default function WhaleCard({ data, lang }: Props) {
  const tr = t(lang);
  return (
    <div className="card-enter card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(139,92,246,.15)' }}>
            🐳
          </div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{tr.whale_card_title}</h3>
        </div>
        <div className="flex gap-2">
          <a href="https://etherscan.io" target="_blank" rel="noreferrer"
            className="text-[11px] font-medium px-2 py-0.5 rounded-full glass-read-inner transition-colors hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}>
            Etherscan ↗
          </a>
          <a href="https://solscan.io" target="_blank" rel="noreferrer"
            className="text-[11px] font-medium px-2 py-0.5 rounded-full glass-read-inner transition-colors hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}>
            Solscan ↗
          </a>
        </div>
      </div>

      <div className="space-y-1.5">
        {data.map((tx) => (
          <div
            key={tx.hash + tx.chain}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all hover:scale-[1.005] glass-read-inner"
          >
            {/* Chain badge */}
            <span
              className="flex-shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold"
              style={{
                background: tx.chain === 'ethereum' ? 'rgba(139,92,246,.2)' : 'rgba(6,182,212,.15)',
                color: tx.chain === 'ethereum' ? '#a78bfa' : '#22d3ee',
              }}
            >
              {tx.chain === 'ethereum' ? 'ETH' : 'SOL'}
            </span>

            {/* From/To */}
            <div className="flex-1 min-w-0 font-mono" style={{ color: 'var(--text-muted)' }}>
              {tx.from} → {tx.to}
            </div>

            {/* Value */}
            <span className="font-semibold tabular-nums flex-shrink-0" style={{ color: 'var(--text)' }}>
              {tx.value}
            </span>

            {/* Time */}
            <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
              {relativeTime(tx.timestamp)}
            </span>

            {/* Explorer */}
            <a
              href={tx.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-shrink-0 hover:opacity-100 transition-opacity"
              style={{ color: 'var(--text-muted)', opacity: 0.5 }}
            >
              ↗
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
