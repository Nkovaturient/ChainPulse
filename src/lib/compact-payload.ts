/**
 * Trim fetcher output before it enters LLM context.
 * UI cards still receive full data from fetchers — this only affects model input.
 */
import { CONTEXT_LIMITS as L } from '@/lib/agent-config';
import type { QueryResponse } from '@/types';

function sampleSparkline(points: number[], target = L.sparklinePointsForModel): number[] {
  if (points.length <= target) return points;
  const step = Math.ceil(points.length / target);
  const out: number[] = [];
  for (let i = 0; i < points.length; i += step) out.push(points[i]!);
  if (out[out.length - 1] !== points[points.length - 1]) out.push(points[points.length - 1]!);
  return out;
}

/** Compact QueryResponse slice for summarizer / tool-result context */
export function compactForModel(data: Partial<QueryResponse>): Partial<QueryResponse> {
  const out: Partial<QueryResponse> = {};

  if (data.price?.length) {
    out.price = data.price.slice(0, L.maxPricesForModel).map((p) => ({
      id: p.id,
      symbol: p.symbol,
      name: p.name,
      usd: p.usd,
      usd_24h_change: p.usd_24h_change,
      usd_market_cap: p.usd_market_cap,
      sparkline: sampleSparkline(p.sparkline ?? []),
      source: p.source,
      fetchedAt: p.fetchedAt,
    }));
  }

  if (data.whale?.length) {
    out.whale = data.whale.slice(0, L.maxWhalesForModel).map((w) => ({
      hash: w.hash.slice(0, 12) + '…',
      from: w.from.slice(0, 10) + '…',
      to: w.to.slice(0, 10) + '…',
      value: w.value,
      chain: w.chain,
      timestamp: w.timestamp,
      explorerUrl: w.explorerUrl,
    }));
  }

  if (data.news?.length) {
    out.news = data.news.slice(0, L.maxNewsForModel).map((n) => ({
      title: n.title,
      pubDate: n.pubDate,
      source: n.source,
      link: n.link,
    }));
  }

  if (data.defi?.length) {
    out.defi = data.defi.slice(0, L.maxDefiForModel);
  }

  if (data.staking?.length) {
    out.staking = data.staking.slice(0, L.maxStakingForModel);
  }

  return out;
}

/** Compact arbitrary tool JSON before tool_result is appended to agent messages */
export function compactToolData(name: string, data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;

  if (name === 'get_prices' && Array.isArray(data)) {
    return data.slice(0, L.maxPricesForModel).map((p: Record<string, unknown>) => ({
      ...p,
      sparkline: sampleSparkline(Array.isArray(p.sparkline) ? (p.sparkline as number[]) : []),
    }));
  }

  if (name === 'get_whale_transactions' && Array.isArray(data)) {
    return data.slice(0, L.maxWhalesForModel);
  }

  if (name === 'get_news' && Array.isArray(data)) {
    return data.slice(0, L.maxNewsForModel);
  }

  if (name === 'get_defi_tvl' && Array.isArray(data)) {
    return data.slice(0, L.maxDefiForModel);
  }

  if (name === 'get_staking_yields' && Array.isArray(data)) {
    return data.slice(0, L.maxStakingForModel);
  }

  return data;
}
