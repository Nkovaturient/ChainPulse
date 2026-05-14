import Anthropic from '@anthropic-ai/sdk';
import type { IntentResult } from '@/types';

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const DEFAULT_INTENT: IntentResult = {
  intents: ['PRICE'],
  coins: ['bitcoin', 'ethereum'],
  language: 'en',
};

export async function classifyIntent(query: string): Promise<IntentResult> {
  try {
    const msg = await getClient().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system:
        `You are ChainPulse intent classifier. Analyze the query and return ONLY a raw JSON object with no markdown fences, no explanation.
Schema: {"intents": string[], "coins": string[], "language": string}
Valid intents: PRICE, WHALE, NEWS, DEFI_TVL, STAKING, GOVERNANCE.
Intent rules — ONLY include an intent if explicitly requested:
- NEWS: only when user asks for news/headlines/updates/what's happening
- WHALE: only when user asks about whales/large transactions/big moves
- DEFI_TVL: only when user asks about DeFi/TVL/protocols/liquidity
- STAKING: only when user asks about staking/yields/APY/rewards
- PRICE: default for any coin price, market, bullish/bearish, value question
Coin rules: output the canonical slug the way CoinGecko uses it. Examples — "aptos"→"aptos", "apt"→"aptos", "sui"→"sui", "near"→"near", "arb"→"arbitrum", "op"→"optimism", "avax"→"avalanche-2", "matic"→"matic-network", "inj"→"injective-protocol", "tia"→"celestia", "jup"→"jupiter-exchange-solana", "wif"→"dogwifcoin", "bonk"→"bonk", "pepe"→"pepe", "ldo"→"lido-dao", "link"→"chainlink", "uni"→"uniswap", "mkr"→"maker", "doge"→"dogecoin", "shib"→"shiba-inu", "ada"→"cardano", "xrp"→"ripple", "dot"→"polkadot", "ltc"→"litecoin", "atom"→"cosmos", "ftm"→"fantom", "algo"→"algorand", "icp"→"internet-computer", "hbar"→"hedera-hashgraph", "stx"→"stacks", "sei"→"sei-network", "pyth"→"pyth-network". When unsure of exact slug, output the ticker in lowercase (e.g. "apt", "sui") — the fetcher will resolve it.
Language: en for English, hi for Hindi/Devanagari, bn for Bengali. Default to en.`,
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
