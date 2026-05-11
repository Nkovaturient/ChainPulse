import Anthropic from '@anthropic-ai/sdk';
import type { IntentResult } from '@/types';

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const DEFAULT_INTENT: IntentResult = {
  intents: ['NEWS', 'PRICE'],
  coins: ['bitcoin', 'ethereum'],
  language: 'en',
};

export async function classifyIntent(query: string): Promise<IntentResult> {
  try {
    const msg = await getClient().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system:
        'You are ChainPulse intent classifier. Analyze the query and return ONLY a raw JSON object with no markdown fences, no explanation. Schema: {"intents": string[], "coins": string[], "language": string}. Valid intents: PRICE, WHALE, NEWS, DEFI_TVL, STAKING, GOVERNANCE. Valid coins: bitcoin, ethereum, solana, bnb, cardano, polkadot, avalanche-2, chainlink, uniswap. Detect language from query text: en for English, hi for Hindi/Devanagari, bn for Bengali. Default language to en if uncertain.',
      messages: [{ role: 'user', content: query }],
    });

    const block = msg.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') return DEFAULT_INTENT;

    const text = block.text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(text);

    return {
      intents: Array.isArray(parsed.intents) && parsed.intents.length ? parsed.intents : DEFAULT_INTENT.intents,
      coins: Array.isArray(parsed.coins) && parsed.coins.length ? parsed.coins : DEFAULT_INTENT.coins,
      language: ['en', 'hi', 'bn'].includes(parsed.language) ? parsed.language : 'en',
    };
  } catch {
    return DEFAULT_INTENT;
  }
}
