'use client';

import type { DefiProtocol, Language } from '@/types';
import { t } from '@/lib/translations';
import { formatUSD } from '@/lib/utils';

interface Props {
  data: DefiProtocol[];
  lang: Language;
}

export default function DefiCard({ data, lang }: Props) {
  const tr = t(lang);
  return (
    <div className="card-enter card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(16,185,129,.15)' }}>
            🏦
          </div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{tr.defi_card_title}</h3>
        </div>
        <a href="https://defillama.com" target="_blank" rel="noreferrer"
          className="text-[11px] font-medium px-2 py-0.5 rounded-full border hover:opacity-80 transition-opacity"
          style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
          DefiLlama ↗
        </a>
      </div>

      <div className="space-y-1">
        {data.map((p, i) => {
          const up = p.change_1d >= 0;
          const tvlPct = Math.min(100, (p.tvl / data[0].tvl) * 100);
          return (
            <div
              key={p.name}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:scale-[1.005]"
              style={{ background: 'var(--bg-card2)' }}
            >
              {/* Rank */}
              <span className="text-[11px] w-5 text-right flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                {i + 1}
              </span>

              {/* Name + category */}
              <div className="flex-1 min-w-0">
                <a href={p.url} target="_blank" rel="noreferrer"
                  className="text-xs font-medium hover:underline underline-offset-2"
                  style={{ color: 'var(--text)' }}>
                  {p.name}
                </a>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {p.category}
                </div>
                {/* TVL bar */}
                <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${tvlPct}%`, background: 'var(--accent)' }}
                  />
                </div>
              </div>

              {/* TVL */}
              <span className="text-xs font-semibold tabular-nums flex-shrink-0" style={{ color: 'var(--text)' }}>
                {formatUSD(p.tvl, { compact: true })}
              </span>

              {/* Change */}
              <span
                className="text-[11px] font-medium tabular-nums flex-shrink-0 w-14 text-right"
                style={{ color: up ? 'var(--green)' : 'var(--red)' }}
              >
                {up ? '+' : ''}{p.change_1d.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
