/**
 * Pure derivations over a WalletReport — the single source of truth shared by
 * every chart and insight surface. No network, no duplication of fetch logic.
 */
import type { WalletReport } from './types';
import type { ChainKey } from './chains';

export interface Position {
  id: string;            // unique key: chain + symbol/contract
  symbol: string;
  name: string;
  chain: ChainKey;
  amount: number;
  usd: number;
  change24h: number | null;
  category: string | null;
  isNative: boolean;
}

export interface AllocSlice {
  label: string;
  usd: number;
  pct: number;           // 0–100
}

/** Flatten natives + priced tokens into one position list, sorted by USD desc. */
export function getPositions(report: WalletReport): Position[] {
  const positions: Position[] = [];

  for (const n of report.natives) {
    if (n.usd <= 0) continue;
    positions.push({
      id: `${n.chain}:native:${n.symbol}`,
      symbol: n.symbol,
      name: n.symbol,
      chain: n.chain,
      amount: n.amount,
      usd: n.usd,
      change24h: n.change24h,
      category: n.category ?? 'Layer 1',
      isNative: true,
    });
  }
  for (const t of report.tokens) {
    if (t.usd === null || t.usd <= 0) continue;
    positions.push({
      id: `${t.chain}:${t.contractAddress}`,
      symbol: t.symbol,
      name: t.name,
      chain: t.chain,
      amount: t.amount,
      usd: t.usd,
      change24h: t.change24h,
      category: t.category,
      isNative: false,
    });
  }

  return positions.sort((a, b) => b.usd - a.usd);
}

function toSlices(groups: Map<string, number>, total: number, topN: number): AllocSlice[] {
  if (total <= 0) return [];
  const sorted = Array.from(groups.entries()).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, topN);
  const restUsd = sorted.slice(topN).reduce((s, [, v]) => s + v, 0);
  const slices: AllocSlice[] = top.map(([label, usd]) => ({
    label,
    usd,
    pct: (usd / total) * 100,
  }));
  if (restUsd > 0) slices.push({ label: 'Other', usd: restUsd, pct: (restUsd / total) * 100 });
  return slices;
}

/** Allocation by coin symbol (positions of the same symbol are merged). */
export function getCoinAllocation(report: WalletReport, topN = 8): AllocSlice[] {
  const positions = getPositions(report);
  const total = positions.reduce((s, p) => s + p.usd, 0);
  const groups = new Map<string, number>();
  for (const p of positions) groups.set(p.symbol, (groups.get(p.symbol) ?? 0) + p.usd);
  return toSlices(groups, total, topN);
}

/** Allocation by category bucket (AI, DeFi, RWA, Meme, …). */
export function getCategoryAllocation(report: WalletReport): AllocSlice[] {
  const positions = getPositions(report);
  const total = positions.reduce((s, p) => s + p.usd, 0);
  const groups = new Map<string, number>();
  for (const p of positions) {
    const label = p.category ?? 'Other';
    groups.set(label, (groups.get(label) ?? 0) + p.usd);
  }
  return toSlices(groups, total, 8);
}

export interface PerfItem {
  symbol: string;
  chain: ChainKey;
  usd: number;
  change24h: number;
}

export interface Performance {
  items: PerfItem[];           // all priced positions w/ known 24h change, by |change|
  portfolioChange24h: number;  // USD-weighted % change
  movers: PerfItem[];          // top gainers
  laggards: PerfItem[];        // top losers
  hasData: boolean;
}

/** 24h performance derived from positions that have a known change. */
export function getPerformance(report: WalletReport): Performance {
  const positions = getPositions(report).filter((p) => p.change24h !== null);
  const items: PerfItem[] = positions.map((p) => ({
    symbol: p.symbol,
    chain: p.chain,
    usd: p.usd,
    change24h: p.change24h as number,
  }));

  const total = items.reduce((s, p) => s + p.usd, 0);
  const portfolioChange24h =
    total > 0 ? items.reduce((s, p) => s + p.change24h * (p.usd / total), 0) : 0;

  const byChange = [...items].sort((a, b) => b.change24h - a.change24h);
  return {
    items: [...items].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h)),
    portfolioChange24h,
    movers: byChange.filter((p) => p.change24h > 0).slice(0, 3),
    laggards: byChange.filter((p) => p.change24h < 0).reverse().slice(0, 3),
    hasData: items.length > 0,
  };
}

export type InsightTone = 'positive' | 'negative' | 'neutral' | 'warning';

export interface Insight {
  label: string;
  detail: string;
  tone: InsightTone;
}

const STABLE_SYMBOLS = new Set(['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'USDE', 'FRAX', 'USDP', 'PYUSD']);

/** Heuristic portfolio flags available to all users. */
export function getInsights(report: WalletReport): Insight[] {
  const positions = getPositions(report);
  const total = positions.reduce((s, p) => s + p.usd, 0);
  const insights: Insight[] = [];
  if (total <= 0) return insights;

  // Concentration
  const top = positions[0];
  if (top) {
    const pct = (top.usd / total) * 100;
    if (pct >= 50) {
      insights.push({
        label: 'Concentration risk',
        detail: `${top.symbol} is ${pct.toFixed(0)}% of the portfolio — heavily concentrated.`,
        tone: 'warning',
      });
    }
  }

  // Stablecoin cushion
  const stableUsd = positions
    .filter((p) => STABLE_SYMBOLS.has(p.symbol.toUpperCase()))
    .reduce((s, p) => s + p.usd, 0);
  if (stableUsd > 0) {
    insights.push({
      label: 'Stablecoin allocation',
      detail: `${((stableUsd / total) * 100).toFixed(0)}% sits in stablecoins (${fmtUsd(stableUsd)}).`,
      tone: 'neutral',
    });
  }

  // Chain spread
  const activeChains = report.perChain.filter((c) => c.totalUsd > 0).length;
  if (activeChains >= 3) {
    insights.push({
      label: 'Multi-chain spread',
      detail: `Holdings are diversified across ${activeChains} chains.`,
      tone: 'positive',
    });
  }

  // 24h moves
  const perf = getPerformance(report);
  if (perf.hasData) {
    const tone: InsightTone = perf.portfolioChange24h >= 0 ? 'positive' : 'negative';
    insights.push({
      label: '24h portfolio move',
      detail: `${perf.portfolioChange24h >= 0 ? '+' : ''}${perf.portfolioChange24h.toFixed(2)}% weighted by holdings.`,
      tone,
    });
    const lead = perf.movers[0];
    const lag = perf.laggards[0];
    if (lead) {
      insights.push({
        label: 'Top mover',
        detail: `${lead.symbol} +${lead.change24h.toFixed(1)}% in 24h.`,
        tone: 'positive',
      });
    }
    if (lag) {
      insights.push({
        label: 'Biggest laggard',
        detail: `${lag.symbol} ${lag.change24h.toFixed(1)}% in 24h.`,
        tone: 'negative',
      });
    }
  }

  return insights;
}

export interface PremiumSummary {
  summary: string;
  drivers: string[];
}

/** Richer narrative reserved for premium users. */
export function getPremiumSummary(report: WalletReport): PremiumSummary {
  const positions = getPositions(report);
  const total = positions.reduce((s, p) => s + p.usd, 0);
  const perf = getPerformance(report);
  const coinAlloc = getCoinAllocation(report, 3);
  const catAlloc = getCategoryAllocation(report);

  const topCoins = coinAlloc.map((s) => `${s.label} (${s.pct.toFixed(0)}%)`).join(', ');
  const topCat = catAlloc[0];
  const dir = perf.portfolioChange24h >= 0 ? 'up' : 'down';

  const summary =
    total <= 0
      ? 'No priced holdings detected for this wallet.'
      : `This wallet holds ${fmtUsd(total)} concentrated in ${topCoins}` +
        (topCat ? `, with the largest sector exposure to ${topCat.label} (${topCat.pct.toFixed(0)}%)` : '') +
        `. Over the last 24h it is ${dir} ${Math.abs(perf.portfolioChange24h).toFixed(2)}% on a holdings-weighted basis.`;

  const drivers: string[] = [];
  for (const m of perf.movers.slice(0, 2)) {
    drivers.push(`${m.symbol} pulled the portfolio up (+${m.change24h.toFixed(1)}%, ${fmtUsd(m.usd)} held).`);
  }
  for (const l of perf.laggards.slice(0, 2)) {
    drivers.push(`${l.symbol} weighed it down (${l.change24h.toFixed(1)}%, ${fmtUsd(l.usd)} held).`);
  }
  if (!drivers.length && total > 0) drivers.push('No significant 24h price drivers across priced holdings.');

  return { summary, drivers };
}

function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (n < 0.01) return '<$0.01';
  return `$${n.toFixed(2)}`;
}
