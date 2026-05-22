import Anthropic from '@anthropic-ai/sdk';
import type { IntentResult, Language, QueryResponse } from '@/types';
import { TOOL_DEFS, executeTool } from '@/lib/agent-tools';
import {
  CLASSIFIER_SYSTEM,
  buildResearchSystem,
  languageName,
} from '@/lib/agent-prompts';
import { MODELS, TOKEN_BUDGETS, CONTEXT_LIMITS } from '@/lib/agent-config';
import { trimHistoryForModel } from '@/lib/history-context';
import type { HistoryTurn } from '@/lib/summarizer';

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

/** Routing complexity emitted by the classifier — decides fast vs agentic mode. */
export type Complexity = 'simple' | 'complex';

export interface RouteDecision extends IntentResult {
  complexity: Complexity;
}

const DEFAULT_ROUTE: RouteDecision = {
  intents: ['PRICE'],
  coins: ['bitcoin', 'ethereum'],
  language: 'en',
  complexity: 'simple',
};

// ─── 1. Classifier / Router ────────────────────────────────────────────────────

export async function classifyIntent(query: string): Promise<RouteDecision> {
  try {
    const msg = await getClient().messages.create({
      model: MODELS.router,
      max_tokens: TOKEN_BUDGETS.router,
      system: CLASSIFIER_SYSTEM,
      messages: [{ role: 'user', content: query }],
    });

    const block = msg.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') return DEFAULT_ROUTE;

    const text = block.text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(text) as Partial<RouteDecision>;

    return {
      intents: Array.isArray(parsed.intents) && parsed.intents.length
        ? (parsed.intents as IntentResult['intents'])
        : DEFAULT_ROUTE.intents,
      coins: Array.isArray(parsed.coins) && parsed.coins.length
        ? parsed.coins
        : DEFAULT_ROUTE.coins,
      language: (['en', 'hi', 'bn'] as Language[]).includes(parsed.language as Language)
        ? (parsed.language as Language)
        : 'en',
      complexity: parsed.complexity === 'complex' ? 'complex' : 'simple',
    };
  } catch {
    return DEFAULT_ROUTE;
  }
}

// ─── 2. Agentic loop (complex queries) ─────────────────────────────────────────

const MAX_ITERATIONS = CONTEXT_LIMITS.maxAgentIterations;

export interface AgentRunResult {
  summary: string;
  data: Partial<QueryResponse>;
  errors: Record<string, string>;
  iterations: number;
}

export async function runAgentLoop(
  query: string,
  language: Language,
  history: HistoryTurn[] = [],
): Promise<AgentRunResult> {
  const client = getClient();

  const trimmed = trimHistoryForModel(history);
  const historyMessages: Anthropic.MessageParam[] = trimmed.map((h) => ({
    role: h.role,
    content: h.text,
  }));

  const messages: Anthropic.MessageParam[] = [
    ...historyMessages,
    { role: 'user', content: query },
  ];

  const accumulatedData: Partial<QueryResponse> = {};
  const errors: Record<string, string> = {};
  let summary = '';
  let iterations = 0;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    iterations = i + 1;

    let response: Anthropic.Message;
    try {
      response = await client.messages.create({
        model: MODELS.agent,
        max_tokens: TOKEN_BUDGETS.agent,
        system: buildResearchSystem(languageName(language)),
        tools: TOOL_DEFS,
        messages,
      });
    } catch (err) {
      errors.agent = err instanceof Error ? err.message : 'agent call failed';
      break;
    }

    messages.push({ role: 'assistant', content: response.content });

    const textPieces = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text.trim())
      .filter(Boolean);
    if (textPieces.length) summary = textPieces.join('\n\n');

    if (response.stop_reason !== 'tool_use') break;

    const toolBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    );
    if (!toolBlocks.length) break;

    const results = await Promise.all(
      toolBlocks.map(async (tb) => {
        const exec = await executeTool(tb.name, tb.input);
        Object.assign(accumulatedData, mergeData(accumulatedData, exec.dataPatch));
        if (exec.error) errors[exec.error.key] = exec.error.msg;
        return {
          type: 'tool_result' as const,
          tool_use_id: tb.id,
          content: exec.payload,
        };
      }),
    );

    messages.push({ role: 'user', content: results });
  }

  return { summary: summary.trim(), data: accumulatedData, errors, iterations };
}

/** Merge tool output into the accumulator (concat arrays, prefer non-empty). */
function mergeData(
  current: Partial<QueryResponse>,
  patch: Partial<QueryResponse>,
): Partial<QueryResponse> {
  const out = { ...current };
  if (patch.price?.length)   out.price   = [...(current.price ?? []),   ...patch.price];
  if (patch.whale?.length)   out.whale   = [...(current.whale ?? []),   ...patch.whale];
  if (patch.news?.length)    out.news    = patch.news;
  if (patch.defi?.length)    out.defi    = patch.defi;
  if (patch.staking?.length) out.staking = patch.staking;
  return out;
}
