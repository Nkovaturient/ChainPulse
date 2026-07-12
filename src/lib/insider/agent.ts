import Anthropic from '@anthropic-ai/sdk';
import { TOOL_DEFS, executeTool } from '@/lib/agent-tools';
import { buildInsiderSystem } from '@/lib/agent-prompts';
import { MODELS, TOKEN_BUDGETS, CONTEXT_LIMITS } from '@/lib/agent-config';
import { trimHistoryForModel } from '@/lib/history-context';
import type { HistoryTurn } from '@/lib/summarizer';
import type { Language, QueryResponse } from '@/types';

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export interface InsiderRunResult {
  summary: string;
  data: Partial<QueryResponse>;
  errors: Record<string, string>;
  iterations: number;
}

export async function runInsiderAgentLoop(
  query: string,
  language: Language,
  history: HistoryTurn[] = [],
): Promise<InsiderRunResult> {
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
  const MAX_ITERATIONS = CONTEXT_LIMITS.maxAgentIterations;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    iterations = i + 1;
    let response: Anthropic.Message;
    try {
      response = await client.messages.create({
        model: MODELS.agent,
        max_tokens: TOKEN_BUDGETS.agent,
        system: buildInsiderSystem(language === 'hi' ? 'Hindi' : language === 'bn' ? 'Bengali' : 'English'),
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

function mergeData(current: Partial<QueryResponse>, patch: Partial<QueryResponse>): Partial<QueryResponse> {
  const out = { ...current };
  if (patch.price?.length)   out.price   = [...(current.price ?? []),   ...patch.price];
  if (patch.whale?.length)   out.whale   = [...(current.whale ?? []),   ...patch.whale];
  if (patch.news?.length)    out.news    = patch.news;
  if (patch.defi?.length)    out.defi    = patch.defi;
  if (patch.staking?.length) out.staking = patch.staking;
  return out;
}
