import Anthropic from '@anthropic-ai/sdk';
import {
  INSIDER_LIMITS,
  MODELS,
  TOKEN_BUDGETS,
} from '@/lib/agent-config';
import {
  countSessionMessages,
  getMessagesForSummary,
  getSessionSummary,
  setSessionSummary,
  type StoredMessage,
} from '@/lib/chat-storage';

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function formatMessagesForSummary(messages: StoredMessage[]): string {
  return messages
    .map((m) => {
      const prefix = m.role === 'user' ? 'User' : 'Assistant';
      let line = `${prefix}: ${m.text}`;
      if (m.role === 'assistant' && m.feedback === 'down') {
        line += ' [User rejected this response]';
      }
      return line;
    })
    .join('\n');
}

function truncateSummary(text: string): string {
  const max = INSIDER_LIMITS.summaryMaxChars;
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}

export async function maybeRefreshSessionSummary(sessionId: string): Promise<void> {
  const count = await countSessionMessages(sessionId);
  if (count <= INSIDER_LIMITS.summaryTriggerMessages) return;

  const existing = await getSessionSummary(sessionId);
  const olderMessages = await getMessagesForSummary(
    sessionId,
    4,
    INSIDER_LIMITS.summaryMaxInputMessages,
  );
  if (olderMessages.length === 0 && !existing) return;

  const transcript = formatMessagesForSummary(olderMessages);
  const client = getClient();

  const response = await client.messages.create({
    model: MODELS.synthesize,
    max_tokens: TOKEN_BUDGETS.insiderSummary,
    thinking: { type: 'disabled' },
    system: `You compress chat transcripts into brief session memory for a crypto insider bot.
Rules:
- Summarize conversation topics and user intent only.
- When a message is marked [User rejected this response], note what the user disliked in one short phrase.
- Do NOT invent prices, addresses, tx hashes, or on-chain facts.
- Output plain text only, under ${INSIDER_LIMITS.summaryMaxChars} characters.`,
    messages: [
      {
        role: 'user',
        content: existing
          ? `Prior summary:\n${existing}\n\nNew messages to fold in:\n${transcript}`
          : `Summarize this conversation:\n${transcript}`,
      },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text.trim())
    .join('\n')
    .trim();

  if (!text) return;
  await setSessionSummary(sessionId, truncateSummary(text));
}
