import Anthropic from '@anthropic-ai/sdk';
import { buildInsiderAlertSynthesizerSystem } from '@/lib/insider/system-prompt';
import { categorySystemNote, type InsiderCategoryFilter } from '@/lib/insider/categories';
import { buildEvidenceFromAlerts } from '@/lib/insider/citations';
import { languageName } from '@/lib/agent-prompts';
import { INSIDER_LIMITS, MODELS, TOKEN_BUDGETS } from '@/lib/agent-config';
import { trimHistoryForModel } from '@/lib/history-context';
import type { HistoryTurn } from '@/lib/summarizer';
import type { InsiderEvidence, Language } from '@/types';
import type { InsiderAlert } from '@prisma/client';

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function compactAlertsForModel(alerts: InsiderAlert[]) {
  return alerts.slice(0, INSIDER_LIMITS.maxAlertsForModel).map((a) => ({
    chain: a.chain,
    kind: a.kind,
    summary: a.summary,
    amountUsd: a.amountUsd,
    detectedAt: a.detectedAt.toISOString(),
    txHash: `${a.txHash.slice(0, 14)}…`,
    sourceUrl: a.sourceUrl,
  }));
}

export async function synthesizeInsiderFromAlerts(
  query: string,
  alerts: InsiderAlert[],
  language: Language,
  history: HistoryTurn[] = [],
  category: InsiderCategoryFilter = 'all',
): Promise<{ summary: string; evidence: InsiderEvidence }> {
  const trimmed = trimHistoryForModel(history, {
    historyTurns: INSIDER_LIMITS.historyTurns,
    historyCharsPerTurn: INSIDER_LIMITS.historyCharsPerTurn,
  });
  const historyMessages: Anthropic.MessageParam[] = trimmed.map((h) => ({
    role: h.role,
    content: h.text,
  }));

  const payload = { alerts: compactAlertsForModel(alerts), alertCount: alerts.length };
  const langName = languageName(language);

  const msg = await getClient().messages.create({
    model: MODELS.synthesize,
    max_tokens: TOKEN_BUDGETS.synthesize,
    thinking: { type: 'disabled' },
    system: [
      {
        type: 'text',
        text: buildInsiderAlertSynthesizerSystem(langName) + categorySystemNote(category),
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      ...historyMessages,
      {
        role: 'user',
        content: `User asked: '${query}'.\n\nCached insider alerts (cite these only — do not invent others):\n${JSON.stringify(payload)}`,
      },
    ],
  });

  const block = msg.content.find((b) => b.type === 'text');
  const summary = block && block.type === 'text' ? block.text.trim() : '';
  const evidence = buildEvidenceFromAlerts(alerts, category === 'all' ? undefined : category);
  return { summary, evidence };
}
