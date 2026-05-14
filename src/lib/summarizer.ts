import Anthropic from '@anthropic-ai/sdk';
import type { Language, QueryResponse } from '@/types';

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

const SUMMARIZER_SYSTEM = (langName: string) => `You are ChainPulse, a senior crypto research analyst. Respond in ${langName}.

You are given a user query, optional prior conversation, and a JSON payload of live data already fetched on your behalf (prices, news, whale txns, TVL, staking yields). Your job is to synthesize a crisp, insightful answer using that data.

OUTPUT DOCTRINE:
- Default: 2–4 concise sentences. Numbers-first. Source-tagged.
- Elaborate only when query contains: "explain", "deep dive", "compare", "details", "walk me through", "why", "how does", or asks for a list of 3+ items.
- Lists when comparing ≥3 items; prose otherwise. Use **bold** for key terms/numbers.
- No headers (#, ##, ###). No blockquotes. Plain markdown — paragraphs, **bold**, and "- bullet" only.
- Tag claims when relevant:
  • Live numbers fetched from CoinGecko/DefiLlama/RSS need no tag (they're shown alongside in cards).
  • If you reference something NOT in the data payload, mark it "(general knowledge)" or "(unconfirmed)".
- If the data payload is missing what the user asked for, say so plainly — never fabricate prices, market caps, TVLs, or APYs.
- NEVER give financial advice. Always close with a single ⚠ line when discussing prices/yields/risk.

STYLE:
- No hedging filler ("it's worth noting", "as you may know", "as an AI"). Just say it.
- No throat-clearing intros. Lead with the answer.
- Keep total response under 180 words unless the user explicitly asked for depth.`;

export async function generateSummary(
  data: Partial<QueryResponse>,
  language: Language,
  query: string,
  history: HistoryTurn[] = [],
): Promise<string> {
  const langName = language === 'hi' ? 'Hindi' : language === 'bn' ? 'Bengali' : 'English';
  try {
    const historyMessages: Anthropic.MessageParam[] = history.slice(-4).map((h) => ({
      role: h.role,
      content: h.text,
    }));

    const msg = await getClient().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: SUMMARIZER_SYSTEM(langName),
      messages: [
        ...historyMessages,
        {
          role: 'user',
          content: `User asked: '${query}'.\n\nFetched data:\n${JSON.stringify(data, null, 2)}`,
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
