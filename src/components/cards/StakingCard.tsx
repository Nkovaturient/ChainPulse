'use client';

import type { Language, StakingPool } from '@/types';
import { t } from '@/lib/translations';
import { formatUSD } from '@/lib/utils';

interface Props {
  data: StakingPool[];
  lang: Language;
}

function apyColor(apy: number): string {
  if (apy > 20) return '#f59e0b';
  if (apy > 10) return '#10b981';
  return '#6366f1';
}

export default function StakingCard({ data, lang }: Props) {
  const tr = t(lang);
  const sorted = [...data].sort((a, b) => b.apy - a.apy);
  const maxApy = sorted[0]?.apy || 1;

  return (
    <div className="card-enter card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(245,158,11,.15)' }}>
            💎
          </div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{tr.staking_card_title}</h3>
        </div>
        <a href="https://yields.llama.fi" target="_blank" rel="noreferrer"
          className="text-[11px] font-medium px-2 py-0.5 rounded-full glass-read-inner hover:opacity-80 transition-opacity">
          DefiLlama Yields ↗
        </a>
      </div>

      <div className="space-y-1">
        {sorted.map((p, i) => {
          const color = apyColor(p.apy);
          const barPct = Math.min(100, (p.apy / maxApy) * 100);
          return (
            <div
              key={`${p.project}-${p.symbol}-${i}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:scale-[1.005] glass-read-inner"
            >
              {/* Rank */}
              <span className="text-[11px] w-5 text-right flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                {i + 1}
              </span>

              {/* Project + symbol */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>{p.project}</span>
                  <span className="text-[10px] font-mono px-1 rounded" style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>
                    {p.symbol}
                  </span>
                </div>
                {/* APY bar */}
                <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${barPct}%`, background: color }}
                  />
                </div>
              </div>

              {/* TVL */}
              <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                {formatUSD(p.tvlUsd, { compact: true })}
              </span>

              {/* Chain */}
              <span className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0"
                style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>
                {p.chain}
              </span>

              {/* APY */}
              <span className="text-sm font-bold tabular-nums flex-shrink-0 w-16 text-right" style={{ color }}>
                {p.apy.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
