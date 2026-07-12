'use client';

import { RefreshCw } from 'lucide-react';
import { CHAIN_BY_KEY } from '@/lib/explorer/chains';
import GlassPanel from '@/components/ui/GlassPanel';
import { shortenAddress } from '@/lib/explorer/address';
import type { WalletReport } from '@/lib/explorer/types';

interface Props {
  report: WalletReport;
  onRefresh?: () => void;
  refreshing?: boolean;
}

function fmtUsd(n: number): string {
  if (n === 0) return '$0';
  if (n < 0.01) return '<$0.01';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  return `$${n.toFixed(2)}`;
}

function fmtAmount(n: number, decimals = 4): string {
  if (n === 0) return '0';
  if (n < 0.0001) return n.toExponential(2);
  return n.toLocaleString('en-US', { maximumFractionDigits: decimals });
}

export default function WalletOverview({ report, onRefresh, refreshing = false }: Props) {
  const activeChains = report.perChain.filter((p) => p.totalUsd > 0 || p.txCount > 0);
  const inactiveCount = report.perChain.length - activeChains.length;

  return (
    <div className="space-y-4">
      {/* Net worth card */}
      <GlassPanel glow="purple" className="rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider mb-1">
              Net worth (estimated)
            </p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
                {fmtUsd(report.netWorthUsd)}
              </h2>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>USD</span>
            </div>
            <p className="text-xs font-mono mt-2" style={{ color: 'var(--text-muted)' }}>
              {shortenAddress(report.address, 10, 8)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Active chains
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
              {activeChains.length}/{report.perChain.length}
            </p>
            {inactiveCount > 0 && (
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {inactiveCount} dormant
              </p>
            )}
          </div>
        </div>
      </GlassPanel>
      <div>
        <div className="flex items-center justify-between gap-3 mb-3 px-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider">
            Per-chain breakdown
          </h3>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              title="Refresh wallet data"
              className="flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1.5 rounded-lg glass-panel transition-all hover:opacity-80 hover:-translate-y-px active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {report.perChain.map((p) => {
            const spec = CHAIN_BY_KEY[p.chain];
            const active = p.totalUsd > 0 || p.txCount > 0;
            return (
              <div
                key={p.chain}
                className="rounded-xl p-3 glass-read-inner transition-all"
                style={{
                  borderColor: active ? `${spec.color}40` : 'var(--glass-border)',
                  opacity: active ? 1 : 0.5,
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: spec.color }}>
                    {spec.short}
                  </span>
                  <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                    {p.txCount} tx
                  </span>
                </div>
                <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text)' }}>
                  {fmtUsd(p.totalUsd)}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {spec.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Native balances summary */}
      {report.natives.filter((n) => n.amount > 0).length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 px-1">
            Native holdings
          </h3>
          <div className="rounded-xl glass-read overflow-hidden">
            {report.natives.filter((n) => n.amount > 0).map((n) => {
              const spec = CHAIN_BY_KEY[n.chain];
              return (
                <div
                  key={n.chain}
                  className="px-4 py-3 flex items-center justify-between text-sm"
                  style={{ borderBottom: '1px solid var(--glass-border)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${spec.color}25`, color: spec.color }}>
                      {spec.short}
                    </span>
                    <span style={{ color: 'var(--text)' }}>
                      {fmtAmount(n.amount, 4)} <span style={{ color: 'var(--text-muted)' }}>{n.symbol}</span>
                    </span>
                  </div>
                  <span style={{ color: 'var(--text-muted)' }} className="font-mono">
                    {fmtUsd(n.usd)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
