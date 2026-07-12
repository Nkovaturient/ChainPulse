'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

const DONUT_SIZE = 160;
import { getCoinAllocation, getCategoryAllocation, type AllocSlice } from '@/lib/explorer/portfolio';
import { CATEGORY_COLORS, type CategoryBucket } from '@/lib/explorer/categories';
import type { WalletReport } from '@/lib/explorer/types';

interface Props {
  report: WalletReport;
}

const COIN_COLORS = ['#6366f1', '#8b5cf6', '#0ea5e9', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6', '#f97316', '#64748b'];

function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (n < 0.01) return '<$0.01';
  return `$${n.toFixed(2)}`;
}

function SliceTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: AllocSlice }> }) {
  if (!active || !payload?.length) return null;
  const s = payload[0].payload;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs glass-read !shadow-none"
      style={{ color: 'var(--text)' }}
    >
      <p className="font-semibold">{s.label}</p>
      <p style={{ color: 'var(--text-muted)' }}>
        {fmtUsd(s.usd)} · {s.pct.toFixed(1)}%
      </p>
    </div>
  );
}

function Donut({
  title,
  subtitle,
  slices,
  colorFor,
}: {
  title: string;
  subtitle: string;
  slices: AllocSlice[];
  colorFor: (slice: AllocSlice, index: number) => string;
}) {
  if (!slices.length) {
    return (
      <div className="rounded-2xl p-5 border glass-read">
        <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>{title}</h3>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No priced holdings to chart.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5 border glass-read">
      <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{title}</h3>
      <p className="text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
      <div className="flex items-center gap-4 flex-col sm:flex-row">
        <div className="flex-shrink-0" style={{ width: DONUT_SIZE, height: DONUT_SIZE }}>
          <PieChart width={DONUT_SIZE} height={DONUT_SIZE}>
            <Pie
              data={slices}
              dataKey="usd"
              nameKey="label"
              innerRadius={44}
              outerRadius={72}
              paddingAngle={2}
              stroke="none"
            >
              {slices.map((s, i) => (
                <Cell key={s.label} fill={colorFor(s, i)} />
              ))}
            </Pie>
            <Tooltip content={<SliceTooltip />} />
          </PieChart>
        </div>
        <ul className="flex-1 w-full space-y-1.5">
          {slices.map((s, i) => (
            <li key={s.label} className="flex items-center justify-between text-xs gap-2">
              <span className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: colorFor(s, i) }} />
                <span className="truncate" style={{ color: 'var(--text)' }}>{s.label}</span>
              </span>
              <span className="flex items-center gap-2 flex-shrink-0">
                <span className="font-mono" style={{ color: 'var(--text-muted)' }}>{fmtUsd(s.usd)}</span>
                <span className="font-semibold tabular-nums" style={{ color: 'var(--text)' }}>{s.pct.toFixed(1)}%</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function AllocationCharts({ report }: Props) {
  const coin = useMemo(() => getCoinAllocation(report), [report]);
  const category = useMemo(() => getCategoryAllocation(report), [report]);

  if (!coin.length && !category.length) return null;

  return (
    <section className="space-y-3" id="allocation">
      <h2 className="text-xs font-semibold uppercase tracking-wider px-1">
        Allocation
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Donut
          title="Coin allocation"
          subtitle="Portfolio composition by holding"
          slices={coin}
          colorFor={(_s, i) => COIN_COLORS[i % COIN_COLORS.length]}
        />
        <Donut
          title="Category allocation"
          subtitle="Exposure across sectors & themes"
          slices={category}
          colorFor={(s) => CATEGORY_COLORS[s.label as CategoryBucket] ?? CATEGORY_COLORS.Other}
        />
      </div>
    </section>
  );
}
