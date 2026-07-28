import type { InsiderAlert } from '@prisma/client';
import type {
  InsiderAlertRef,
  InsiderCitation,
  InsiderEvidence,
  QueryResponse,
} from '@/types';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function compactAlertRef(alert: InsiderAlert): InsiderAlertRef {
  return {
    id: alert.id,
    chain: alert.chain,
    kind: alert.kind,
    category: alert.category,
    summary: alert.summary,
    amountUsd: alert.amountUsd,
    txHash: alert.txHash,
    sourceUrl: alert.sourceUrl,
    detectedAt: alert.detectedAt.toISOString(),
  };
}

export function citationsFromAlerts(alerts: InsiderAlert[]): InsiderCitation[] {
  return alerts.map((a) => ({
    type: 'alert',
    label: `${a.chain} alert · ${relativeTime(a.detectedAt.toISOString())}`,
    url: a.sourceUrl ?? undefined,
    alertId: a.id,
    fetchedAt: a.detectedAt.toISOString(),
    source: 'cached_alert',
  }));
}

export function citationsFromTools(data: Partial<QueryResponse>): InsiderCitation[] {
  const citations: InsiderCitation[] = [];
  const now = new Date().toISOString();

  for (const w of data.whale ?? []) {
    citations.push({
      type: 'tx',
      label: `Etherscan · ${relativeTime(w.timestamp || now)}`,
      url: w.explorerUrl,
      fetchedAt: w.timestamp || now,
      source: w.chain === 'solana' ? 'solscan' : 'etherscan',
    });
  }
  for (const p of data.price ?? []) {
    citations.push({
      type: 'price',
      label: `CoinGecko · ${p.symbol}`,
      url: `https://www.coingecko.com/en/coins/${p.id}`,
      fetchedAt: p.fetchedAt,
      source: 'coingecko',
    });
  }
  for (const d of data.defi ?? []) {
    citations.push({
      type: 'defi',
      label: `DefiLlama · ${d.name}`,
      url: d.url,
      fetchedAt: now,
      source: 'defillama',
    });
  }
  for (const n of data.news ?? []) {
    citations.push({
      type: 'news',
      label: `${n.source} · news`,
      url: n.link,
      fetchedAt: n.pubDate || now,
      source: n.source,
    });
  }

  return citations;
}

export function buildEvidenceFromAlerts(
  alerts: InsiderAlert[],
  category?: InsiderEvidence['category'],
): InsiderEvidence {
  return {
    citations: citationsFromAlerts(alerts),
    alerts: alerts.map(compactAlertRef),
    category,
  };
}

export function buildEvidenceFromAgent(
  data: Partial<QueryResponse>,
  category?: InsiderEvidence['category'],
): InsiderEvidence {
  const toolCitations = citationsFromTools(data);
  return {
    citations: toolCitations,
    tools: data,
    category,
  };
}

export function mergeEvidence(
  base: InsiderEvidence,
  extra: InsiderEvidence,
): InsiderEvidence {
  const seen = new Set(base.citations.map((c) => `${c.type}:${c.label}:${c.url ?? ''}`));
  const mergedCitations = [...base.citations];
  for (const c of extra.citations) {
    const key = `${c.type}:${c.label}:${c.url ?? ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      mergedCitations.push(c);
    }
  }
  return {
    citations: mergedCitations,
    alerts: [...(base.alerts ?? []), ...(extra.alerts ?? [])],
    tools: { ...(base.tools ?? {}), ...(extra.tools ?? {}) },
    category: extra.category ?? base.category,
  };
}
