'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PriceData } from '@/types';

const REFRESH_INTERVAL = 45_000; // 45 seconds

const COIN_ICONS: Record<string, string> = {
  bitcoin: '₿',
  ethereum: 'Ξ',
  solana: '◎',
};

function fmt(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function PriceSkeleton() {
  return (
    <div className="flex items-center gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}>
          <div className="w-4 h-4 rounded-full bg-white/10 animate-pulse" />
          <div className="space-y-1">
            <div className="h-2.5 w-16 rounded bg-white/10 animate-pulse" />
            <div className="h-2 w-10 rounded bg-white/5 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface PriceChipProps {
  coin: PriceData;
}

function PriceChip({ coin }: PriceChipProps) {
  const up = (coin.usd_24h_change ?? 0) >= 0;
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:scale-[1.02] cursor-default"
      style={{
        background: 'rgba(255,255,255,.04)',
        border: '1px solid rgba(255,255,255,.07)',
      }}
    >
      <span className="text-sm font-bold" style={{ color: up ? '#34d399' : '#f87171' }}>
        {COIN_ICONS[coin.id] ?? coin.symbol.toUpperCase().slice(0, 1)}
      </span>
      <div>
        <div className="text-xs font-semibold text-white leading-tight">
          {fmt(coin.usd)}
        </div>
        <div className={`text-[10px] font-medium leading-tight ${up ? 'text-emerald-400' : 'text-red-400'}`}>
          {up ? '+' : ''}{(coin.usd_24h_change ?? 0).toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

export default function LivePriceBar() {
  const [prices, setPrices] = useState<PriceData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch('/api/prices/live');
      if (!res.ok) return;
      const { prices: data } = (await res.json()) as { prices: PriceData[]; ts: number };
      setPrices(data);
      setLastUpdated(new Date());
    } catch {
      // silent — keep stale data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLive();
    timerRef.current = setInterval(() => void fetchLive(), REFRESH_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchLive]);

  const timeAgo = lastUpdated
    ? `${Math.round((Date.now() - lastUpdated.getTime()) / 1000)}s ago`
    : null;

  return (
    <div className="relative z-10 border-b border-white/5">
      {/* Header bar — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-2.5 hover:bg-white/[.02] transition-colors"
        style={{ background: 'rgba(255,255,255,.015)' }}
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
            Live Prices
          </span>
          {timeAgo && (
            <span className="text-[10px] text-white/20 font-mono">· {timeAgo}</span>
          )}
        </div>

        {/* Preview chips (collapsed state) */}
        <div className={`flex items-center gap-1.5 transition-opacity duration-200 ${expanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {loading ? (
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-4 w-16 rounded bg-white/10 animate-pulse" />
              ))}
            </div>
          ) : (
            prices?.slice(0, 3).map((p) => (
              <span key={p.id} className="text-[11px] font-mono text-white/60">
                <span className="text-white/40">{p.symbol.toUpperCase()} </span>
                <span className={(p.usd_24h_change ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {fmt(p.usd)}
                </span>
              </span>
            ))
          )}
        </div>

        {/* Expand indicator */}
        <span
          className={`text-xs text-white/25 ml-2 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        >
          ▾
        </span>
      </button>

      {/* Expanded panel */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-6 py-3" style={{ background: 'rgba(255,255,255,.01)' }}>
          {loading ? (
            <PriceSkeleton />
          ) : prices && prices.length > 0 ? (
            <div className="flex items-center flex-wrap gap-2">
              {prices.map((p) => <PriceChip key={p.id} coin={p} />)}
              <button
                onClick={() => void fetchLive()}
                className="ml-auto text-[10px] text-white/25 hover:text-white/50 transition-colors flex items-center gap-1"
                title="Refresh prices"
              >
                ↺ Refresh
              </button>
            </div>
          ) : (
            <p className="text-xs text-white/25">Price data unavailable</p>
          )}
        </div>
      </div>
    </div>
  );
}
