'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine,
} from 'recharts';
import { getPerformance, type PerfItem } from '@/lib/explorer/portfolio';
import type { WalletReport } from '@/lib/explorer/types';

interface Props {
  report: WalletReport;
}

const UP = '#22c55e';
const DOWN = '#ef4444';

function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (n < 0.01) return '<$0.01';
  return `$${n.toFixed(2)}`;
}

function PerfTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: PerfItem }> }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs border"
      style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)', color: 'var(--text)' }}
    >
      <p className="font-semibold">{p.symbol}</p>
      <p style={{ color: p.change24h >= 0 ? UP : DOWN }}>
        {p.change24h >= 0 ? '+' : ''}{p.change24h.toFixed(2)}% · 24h
      </p>
      <p style={{ color: 'var(--text-muted)' }}>{fmtUsd(p.usd)} held</p>
    </div>
  );
}

export default function PerformanceChart({ report }: Props) {
  const perf = useMemo(() => getPerformance(report), [report]);
  if (!perf.hasData) return null;

  const data = perf.items.slice(0, 10);

  return (
    <section className="space-y-3" id="performance">
      <h2 className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: 'var(--text-muted)' }}>
        What&apos;s moving
      </h2>

      <div className="rounded-2xl p-5 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-baseline justify-between mb-3 gap-2 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Coin performance (24h)</h3>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Price change across your holdings</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Weighted</p>
            <p
              className="text-lg font-bold tabular-nums"
              style={{ color: perf.portfolioChange24h >= 0 ? UP : DOWN }}
            >
              {perf.portfolioChange24h >= 0 ? '+' : ''}{perf.portfolioChange24h.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="w-full" style={{ height: Math.max(160, data.length * 30) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
              <XAxis type="number" hide domain={['dataMin', 'dataMax']} />
              <YAxis
                type="category"
                dataKey="symbol"
                width={56}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <ReferenceLine x={0} stroke="var(--border)" />
              <Tooltip cursor={{ fill: 'transparent' }} content={<PerfTooltip />} />
              <Bar dataKey="change24h" radius={4} barSize={16}>
                {data.map((d) => (
                  <Cell key={d.symbol + d.chain} fill={d.change24h >= 0 ? UP : DOWN} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <MoverList title="Top movers" items={perf.movers} color={UP} />
          <MoverList title="Laggards" items={perf.laggards} color={DOWN} />
        </div>
      </div>
    </section>
  );
}

function MoverList({ title, items, color }: { title: string; items: PerfItem[]; color: string }) {
  return (
    <div className="rounded-xl p-3 border" style={{ background: 'var(--bg-card2)', borderColor: 'var(--border)' }}>
      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{title}</p>
      {items.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>—</p>
      ) : (
        <ul className="space-y-1">
          {items.map((p) => (
            <li key={p.symbol + p.chain} className="flex items-center justify-between text-xs">
              <span className="truncate" style={{ color: 'var(--text)' }}>{p.symbol}</span>
              <span className="font-semibold tabular-nums" style={{ color }}>
                {p.change24h >= 0 ? '+' : ''}{p.change24h.toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
