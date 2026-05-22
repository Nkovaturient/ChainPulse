import Anthropic from '@anthropic-ai/sdk';
import type { Language, QueryResponse } from '@/types';
import { buildSummarizerSystem, languageName } from '@/lib/agent-prompts';
import { MODELS, TOKEN_BUDGETS } from '@/lib/agent-config';
import { compactForModel } from '@/lib/compact-payload';
import { trimHistoryForModel } from '@/lib/history-context';

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export interface HistoryTurn {
  role: 'user' | 'assistant';
  text: string;
}

/** Light cleanup — strip headers (they don't render well in chat bubbles)
 *  but preserve bullets/bold/paragraphs which ReactMarkdown handles cleanly. */
function normalizeMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function generateSummary(
  data: Partial<QueryResponse>,
  language: Language,
  query: string,
  history: HistoryTurn[] = [],
): Promise<string> {
  try {
    const trimmed = trimHistoryForModel(history);
    const historyMessages: Anthropic.MessageParam[] = trimmed.map((h) => ({
      role: h.role,
      content: h.text,
    }));

    const compactData = compactForModel(data);

    const msg = await getClient().messages.create({
      model: MODELS.synthesize,
      max_tokens: TOKEN_BUDGETS.synthesize,
      system: buildSummarizerSystem(languageName(language)),
      messages: [
        ...historyMessages,
        {
          role: 'user',
          content: `User asked: '${query}'.\n\nFetched data (live — cite these numbers, do not invent others):\n${JSON.stringify(compactData)}`,
        },
      ],
    });
    const block = msg.content.find((b) => b.type === 'text');
    if (block && block.type === 'text') return normalizeMarkdown(block.text);
    return '';
  } catch {
    return language === 'hi'
      ? 'सारांश उपलब्ध नहीं है। कृपया डेटा कार्ड देखें।'
      : language === 'bn'
        ? 'সারাংশ উপলব্ধ নয়। অনুগ্রহ করে ডেটা কার্ড দেখুন।'
        : 'Summary unavailable. Please review the data cards below.';
  }
}
