'use client';

import { LineChart, Line, Tooltip } from 'recharts';
import type { PriceData, Language } from '@/types';
import { t } from '@/lib/translations';
import { formatUSD, relativeTime } from '@/lib/utils';

interface Props {
  data: PriceData[];
  lang: Language;
}

export default function PriceCard({ data, lang }: Props) {
  const tr = t(lang);
  return (
    <div className="card-enter card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(99,102,241,.15)' }}>
            📈
          </div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{tr.price_card_title}</h3>
        </div>
        <a href="https://www.coingecko.com" target="_blank" rel="noreferrer"
          className="text-[11px] font-medium px-2 py-0.5 rounded-full border transition-colors hover:opacity-80"
          style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
          CoinGecko ↗
        </a>
      </div>

      <div className="space-y-1">
        {data.map((coin) => {
          const up = coin.usd_24h_change >= 0;
          const lineColor = up ? 'var(--green)' : 'var(--red)';
          const chartData = coin.sparkline.map((v, i) => ({ i, v }));
          return (
            <div
              key={coin.id}
              className="flex items-center gap-4 p-3 rounded-xl transition-all hover:scale-[1.01]"
              style={{ background: 'var(--bg-card2)' }}
            >
              {/* Left: coin info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="font-bold text-base tabular-nums" style={{ color: 'var(--text)' }}>
                    {formatUSD(coin.usd)}
                  </span>
                  <span
                    className="text-xs font-semibold px-1.5 py-0.5 rounded-md"
                    style={{
                      background: up ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.12)',
                      color: up ? 'var(--green)' : 'var(--red)',
                    }}
                  >
                    {up ? '▲' : '▼'} {Math.abs(coin.usd_24h_change).toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{coin.name}</span>
                  <span className="text-[10px] font-mono px-1.5 rounded" style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>
                    {coin.symbol}
                  </span>
                </div>
                <div className="mt-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {tr.fetched_ago} {relativeTime(coin.fetchedAt)} ·{' '}
                  <a href={`https://www.coingecko.com/en/coins/${coin.id}`} target="_blank" rel="noreferrer"
                    className="hover:underline underline-offset-2">
                    {tr.source} ↗
                  </a>
                </div>
              </div>

              {/* Right: sparkline */}
              {chartData.length > 1 && (
                <div className="flex-shrink-0" style={{ width: 100, height: 42 }}>
                  <LineChart width={100} height={42} data={chartData}
                    margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                    <Tooltip contentStyle={{ display: 'none' }} cursor={false} />
                    <Line
                      type="monotone"
                      dataKey="v"
                      stroke={lineColor}
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={true}
                      animationDuration={600}
                    />
                  </LineChart>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
