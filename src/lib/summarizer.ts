import Anthropic from '@anthropic-ai/sdk';
import type { Language, QueryResponse } from '@/types';

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export interface HistoryTurn {
  role: 'user' | 'assistant';
  text: string;
}

/** Trim excessive blank lines but preserve meaningful markdown structure. */
function normalizeMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '') // no headers — keep prose + bullets only
    .replace(/\n{3,}/g, '\n\n')   // collapse 3+ blank lines to max 2
    .trim();
}

export async function generateSummary(
  data: Partial<QueryResponse>,
  language: Language,
  query: string,
  history: HistoryTurn[] = [],
): Promise<string> {
  const langName = language === 'hi' ? 'Hindi' : language === 'bn' ? 'Bengali' : 'English';
  try {
    // Build conversation history for context (last 4 turns, text only)
    const historyMessages: Anthropic.MessageParam[] = history.slice(-4).map((h) => ({
      role: h.role,
      content: h.text,
    }));

    const msg = await getClient().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: `You are ChainPulse, a trustworthy crypto intelligence assistant. Respond in ${langName}.

FORMAT RULES:
- Use clean markdown: short paragraphs, bullet lists (- item), and **bold** for key numbers or terms.
- Do NOT use headers (no #, ##, ###).
- Do NOT use blockquotes (no >) or code blocks.
- Use bullet points when listing multiple items (e.g. top protocols, news headlines, yield pools).
- Write a 1–2 sentence opening paragraph, then bullets if applicable, then a brief closing note.
- Keep total response concise — under 180 words.
- End with a single ⚠ disclaimer line if data carries risk (prices, yields). Never give financial advice.
- If prior conversation context is provided, stay coherent with it.`,
      messages: [
        ...historyMessages,
        {
          role: 'user',
          content: `User asked: '${query}'. Here is the data fetched: ${JSON.stringify(data, null, 2)}`,
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
