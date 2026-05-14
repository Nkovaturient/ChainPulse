'use client';

import { CHAIN_BY_KEY } from '@/lib/explorer/chains';
import { shortenAddress } from '@/lib/explorer/address';
import type { ChainActivity } from '@/lib/explorer/types';

interface Props {
  activity: ChainActivity[];
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  const days = Math.floor(diff / 86_400_000);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtAmount(n: number): string {
  if (n === 0) return '0';
  if (n < 0.0001) return n.toExponential(2);
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
}

function fmtUsd(n: number | null): string {
  if (n === null) return '—';
  if (n < 0.01) return '<$0.01';
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  return `$${n.toFixed(2)}`;
}

export default function TxTimeline({ activity }: Props) {
  if (!activity.length) {
    return (
      <div className="rounded-xl p-4 border text-center text-xs" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        No recent transactions found.
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
        Recent activity (cross-chain)
      </h3>
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        {activity.map((tx, i) => {
          const spec = CHAIN_BY_KEY[tx.chain];
          const isOut = tx.direction === 'out';
          const arrow = isOut ? '→' : tx.direction === 'self' ? '↻' : '←';
          const arrowColor = isOut ? '#f87171' : tx.direction === 'self' ? '#a3a3a3' : '#34d399';
          return (
            <a
              key={tx.hash}
              href={tx.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-3 text-sm transition-colors hover:opacity-80"
              style={i < activity.length - 1 ? { borderBottom: '1px solid var(--border)' } : undefined}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{ background: `${spec.color}25`, color: spec.color }}
                  >
                    {spec.short}
                  </span>
                  <span className="text-lg font-bold flex-shrink-0" style={{ color: arrowColor }}>
                    {arrow}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs truncate" style={{ color: 'var(--text)' }}>
                      {isOut ? shortenAddress(tx.to) : shortenAddress(tx.from)}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {timeAgo(tx.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-mono text-xs" style={{ color: 'var(--text)' }}>
                    {fmtAmount(tx.valueNative)} {spec.nativeSymbol}
                  </p>
                  <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    {fmtUsd(tx.valueUsd)}
                  </p>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
