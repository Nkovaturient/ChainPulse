import Anthropic from '@anthropic-ai/sdk';
import { INSIDER_CLASSIFIER_SYSTEM } from '@/lib/insider/system-prompt';
import { MODELS, TOKEN_BUDGETS } from '@/lib/agent-config';
import type { Language } from '@/types';

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export type InsiderComplexity = 'simple' | 'complex';

export interface InsiderRouteDecision {
  language: Language;
  complexity: InsiderComplexity;
}

const DEFAULT_ROUTE: InsiderRouteDecision = {
  language: 'en',
  complexity: 'complex',
};

export async function classifyInsiderIntent(query: string): Promise<InsiderRouteDecision> {
  try {
    const msg = await getClient().messages.create({
      model: MODELS.router,
      max_tokens: TOKEN_BUDGETS.router,
      system: INSIDER_CLASSIFIER_SYSTEM,
      messages: [{ role: 'user', content: query }],
    });

    const block = msg.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') return DEFAULT_ROUTE;

    const text = block.text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(text) as Partial<InsiderRouteDecision>;

    return {
      language: (['en', 'hi', 'bn'] as Language[]).includes(parsed.language as Language)
        ? (parsed.language as Language)
        : DEFAULT_ROUTE.language,
      complexity: parsed.complexity === 'simple' ? 'simple' : 'complex',
    };
  } catch {
    return DEFAULT_ROUTE;
  }
}
