'use client';

import { CHAIN_BY_KEY } from '@/lib/explorer/chains';
import type { TokenHolding } from '@/lib/explorer/types';

interface Props {
  tokens: TokenHolding[];
  limit?: number;
}

function fmtUsd(n: number | null): string {
  if (n === null) return '—';
  if (n < 0.01) return '<$0.01';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  return `$${n.toFixed(2)}`;
}

function fmtAmount(n: number): string {
  if (n === 0) return '0';
  if (n < 0.0001) return n.toExponential(2);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
}

export default function TokenList({ tokens, limit = 10 }: Props) {
  const shown = tokens.slice(0, limit);
  const remaining = tokens.length - shown.length;

  if (!shown.length) {
    return (
      <div className="rounded-xl p-4 glass-read text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        No ERC-20 token holdings detected.
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
        Top tokens ({tokens.length} total)
      </h3>
      <div className="rounded-xl glass-read overflow-hidden !shadow-none">
        {shown.map((t, i) => {
          const spec = CHAIN_BY_KEY[t.chain];
          return (
            <div
              key={`${t.chain}-${t.contractAddress}`}
              className="px-4 py-3 flex items-center justify-between text-sm"
              style={i < shown.length - 1 ? { borderBottom: '1px solid var(--border)' } : undefined}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{ background: `${spec.color}25`, color: spec.color }}
                  title={spec.name}
                >
                  {spec.short}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate" style={{ color: 'var(--text)' }}>
                    {t.symbol}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                    {t.name}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className="font-mono text-xs" style={{ color: 'var(--text)' }}>
                  {fmtAmount(t.amount)}
                </p>
                <p className="text-[10px] font-mono" style={{ color: t.usd === null ? 'var(--text-muted)' : 'var(--text-muted)' }}>
                  {fmtUsd(t.usd)}
                </p>
              </div>
            </div>
          );
        })}
        {remaining > 0 && (
          <div className="px-4 py-2 text-center text-[10px]" style={{ color: 'var(--text-muted)', background: 'var(--bg-card2)' }}>
            + {remaining} more token{remaining === 1 ? '' : 's'} not shown
          </div>
        )}
      </div>
    </div>
  );
}
