'use client';

import { useMemo } from 'react';
import { getInsights, getPremiumSummary, type InsightTone } from '@/lib/explorer/portfolio';
import type { WalletReport } from '@/lib/explorer/types';

interface Props {
  report: WalletReport;
  premium: boolean;
}

const TONE: Record<InsightTone, { dot: string; text: string }> = {
  positive: { dot: '#22c55e', text: '#22c55e' },
  negative: { dot: '#ef4444', text: '#ef4444' },
  warning: { dot: '#f59e0b', text: '#f59e0b' },
  neutral: { dot: '#64748b', text: 'var(--text-muted)' },
};

export default function PortfolioInsights({ report, premium }: Props) {
  const insights = useMemo(() => getInsights(report), [report]);
  const premiumSummary = useMemo(() => (premium ? getPremiumSummary(report) : null), [report, premium]);

  if (!insights.length) return null;

  return (
    <section className="space-y-3" id="insights">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Portfolio insights
        </h2>
        {!premium && (
          <span className="text-[10px] px-2 py-0.5 rounded-md font-medium"
            style={{ background: 'rgba(99,102,241,.15)', color: '#a5b4fc' }}>
            Upgrade for AI summary
          </span>
        )}
      </div>

      {premiumSummary && (
        <div
          className="rounded-2xl p-5 border"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,.12) 0%, rgba(139,92,246,.06) 100%)',
            borderColor: 'rgba(99,102,241,.25)',
          }}
        >
          <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: '#a5b4fc' }}>
            Insight summary
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{premiumSummary.summary}</p>
          {premiumSummary.drivers.length > 0 && (
            <>
              <p className="text-[10px] uppercase tracking-wider mt-3 mb-1.5" style={{ color: '#a5b4fc' }}>
                Key drivers
              </p>
              <ul className="space-y-1">
                {premiumSummary.drivers.map((d, i) => (
                  <li key={i} className="text-xs flex gap-2" style={{ color: 'var(--text-muted)' }}>
                    <span style={{ color: '#a5b4fc' }}>→</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {insights.map((ins, i) => {
          const tone = TONE[ins.tone];
          return (
            <div
              key={i}
              className="rounded-xl p-3 border flex items-start gap-2.5"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: tone.dot }} />
              <div className="min-w-0">
                <p className="text-xs font-semibold" style={{ color: tone.text }}>{ins.label}</p>
                <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>{ins.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
