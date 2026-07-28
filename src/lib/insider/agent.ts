import Anthropic from '@anthropic-ai/sdk';
import { TOOL_DEFS, executeTool } from '@/lib/agent-tools';
import { buildInsiderSystem } from '@/lib/insider/system-prompt';
import { categorySystemNote, type InsiderCategoryFilter } from '@/lib/insider/categories';
import { buildEvidenceFromAgent } from '@/lib/insider/citations';
import { MODELS, TOKEN_BUDGETS, INSIDER_LIMITS } from '@/lib/agent-config';
import { trimHistoryForModel } from '@/lib/history-context';
import type { HistoryTurn } from '@/lib/summarizer';
import type { InsiderEvidence, Language, QueryResponse } from '@/types';

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export interface InsiderRunOptions {
  sessionSummary?: string | null;
  category?: InsiderCategoryFilter;
}

export interface InsiderRunResult {
  summary: string;
  data: Partial<QueryResponse>;
  evidence: InsiderEvidence;
  errors: Record<string, string>;
  iterations: number;
}

function buildCachedSystemBlocks(
  language: Language,
  sessionSummary?: string | null,
  category: InsiderCategoryFilter = 'all',
): Anthropic.MessageCreateParams['system'] {
  const langName = language === 'hi' ? 'Hindi' : language === 'bn' ? 'Bengali' : 'English';
  const blocks: Anthropic.TextBlockParam[] = [
    {
      type: 'text',
      text: buildInsiderSystem(langName) + categorySystemNote(category),
      cache_control: { type: 'ephemeral' },
    },
  ];
  if (sessionSummary?.trim()) {
    blocks.push({
      type: 'text',
      text: `\n\nPRIOR SESSION CONTEXT (conversation memory — not live market data):\n${sessionSummary.trim()}`,
    });
  }
  return blocks;
}

export async function runInsiderAgentLoop(
  query: string,
  language: Language,
  history: HistoryTurn[] = [],
  options: InsiderRunOptions = {},
): Promise<InsiderRunResult> {
  const client = getClient();
  const trimmed = trimHistoryForModel(history, {
    historyTurns: INSIDER_LIMITS.historyTurns,
    historyCharsPerTurn: INSIDER_LIMITS.historyCharsPerTurn,
  });
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
  const MAX_ITERATIONS = INSIDER_LIMITS.maxAgentIterations;
  const system = buildCachedSystemBlocks(language, options.sessionSummary, options.category ?? 'all');

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    iterations = i + 1;
    let response: Anthropic.Message;
    try {
      response = await client.messages.create({
        model: MODELS.insider,
        max_tokens: TOKEN_BUDGETS.insider,
        thinking: { type: 'disabled' },
        system,
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

  const evidence = buildEvidenceFromAgent(
    accumulatedData,
    options.category && options.category !== 'all' ? options.category : undefined,
  );

  return { summary: summary.trim(), data: accumulatedData, evidence, errors, iterations };
}

function mergeData(current: Partial<QueryResponse>, patch: Partial<QueryResponse>): Partial<QueryResponse> {
  const out = { ...current };
  if (patch.price?.length)   out.price   = [...(current.price ?? []),   ...patch.price];
  if (patch.whale?.length)   out.whale   = [...(current.whale ?? []),   ...patch.whale];
  if (patch.news?.length)    out.news    = patch.news;
  if (patch.defi?.length)    out.defi    = patch.defi;
  if (patch.staking?.length) out.staking = patch.staking;
  return out;
}
