import { CONTEXT_LIMITS } from '@/lib/agent-config';

export interface TextTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface HistoryTrimOptions {
  historyTurns?: number;
  historyCharsPerTurn?: number;
}

/** Trim history for LLM context — full messages remain in DB / UI */
export function trimHistoryForModel(
  turns: TextTurn[],
  opts?: HistoryTrimOptions,
): TextTurn[] {
  const historyTurns = opts?.historyTurns ?? CONTEXT_LIMITS.historyTurns;
  const cap = opts?.historyCharsPerTurn ?? CONTEXT_LIMITS.historyCharsPerTurn;
  return turns.slice(-historyTurns).map((t) => ({
    role: t.role,
    text: t.text.length > cap ? t.text.slice(0, cap - 1) + '…' : t.text,
  }));
}
