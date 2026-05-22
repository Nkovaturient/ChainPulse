import { CONTEXT_LIMITS } from '@/lib/agent-config';

export interface TextTurn {
  role: 'user' | 'assistant';
  text: string;
}

/** Trim history for LLM context — full messages remain in DB / UI */
export function trimHistoryForModel(turns: TextTurn[]): TextTurn[] {
  const cap = CONTEXT_LIMITS.historyCharsPerTurn;
  return turns.slice(-CONTEXT_LIMITS.historyTurns).map((t) => ({
    role: t.role,
    text:
      t.text.length > cap
        ? t.text.slice(0, cap - 1) + '…'
        : t.text,
  }));
}
