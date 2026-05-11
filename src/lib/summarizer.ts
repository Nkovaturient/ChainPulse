import Anthropic from '@anthropic-ai/sdk';
import type { Language, QueryResponse } from '@/types';

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

/** Strip all markdown artifacts from a plain-text response. */
function stripMarkdown(text: string): string {
  return text
    // Remove ATX headings (# ## ### etc.)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic (**text**, *text*, __text__, _text_)
    .replace(/(\*{1,3}|_{1,3})(.*?)\1/g, '$2')
    // Remove blockquotes (> )
    .replace(/^>\s*/gm, '')
    // Remove unordered list markers (- item, * item, • item)
    .replace(/^[\-\*•]\s+/gm, '')
    // Remove ordered list markers (1. 2. etc.)
    .replace(/^\d+\.\s+/gm, '')
    // Remove inline code and code blocks
    .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, '').trim())
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Collapse multiple blank lines into one
    .replace(/\n{3,}/g, '\n\n')
    // Flatten multiple paragraphs into a single flowing paragraph
    .replace(/\n{2,}/g, ' ')
    .replace(/\n/g, ' ')
    // Clean up extra spaces
    .replace(/  +/g, ' ')
    .trim();
}

export async function generateSummary(
  data: Partial<QueryResponse>,
  language: Language,
  query: string
): Promise<string> {
  const langName = language === 'hi' ? 'Hindi' : language === 'bn' ? 'Bengali' : 'English';
  try {
    const msg = await getClient().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: `You are ChainPulse, a trustworthy crypto intelligence assistant. Respond in ${langName}.

STRICT OUTPUT RULES — violations are not allowed:
- Plain prose only. No markdown whatsoever.
- No headers (no #, ##, ###).
- No bold or italic (no **, *, __, _).
- No bullet points, dashes, or numbered lists.
- No blockquotes (no >).
- No code blocks or backticks.
- No emoji except a single warning sign if you must note a limitation.
- Write 3–4 complete sentences in a single paragraph.
- Be factual, cite the numbers you were given, and never give financial advice.`,
      messages: [
        {
          role: 'user',
          content: `User asked: '${query}'. Here is the data fetched: ${JSON.stringify(data, null, 2)}`,
        },
      ],
    });
    const block = msg.content.find((b) => b.type === 'text');
    if (block && block.type === 'text') return stripMarkdown(block.text);
    return '';
  } catch {
    return language === 'hi'
      ? 'सारांश उपलब्ध नहीं है। कृपया डेटा कार्ड देखें।'
      : language === 'bn'
        ? 'সারাংশ উপলব্ধ নয়। অনুগ্রহ করে ডেটা কার্ড দেখুন।'
        : 'Summary unavailable. Please review the data cards below.';
  }
}
