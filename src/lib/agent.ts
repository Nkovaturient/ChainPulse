import Anthropic from '@anthropic-ai/sdk';
import type { IntentResult, Language, QueryResponse } from '@/types';
import { TOOL_DEFS, executeTool } from '@/lib/agent-tools';
import type { HistoryTurn } from '@/lib/summarizer';

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

/** Routing complexity emitted by the classifier — decides fast vs agentic mode. */
export type Complexity = 'simple' | 'complex';

export interface RouteDecision extends IntentResult {
  complexity: Complexity;
}

const DEFAULT_ROUTE: RouteDecision = {
  intents: ['PRICE'],
  coins: ['bitcoin', 'ethereum'],
  language: 'en',
  complexity: 'simple',
};

// ─── 1. Classifier / Router ────────────────────────────────────────────────────

const CLASSIFIER_SYSTEM = `You are ChainPulse's query router. Analyze the query and return ONLY a raw JSON object with no markdown fences and no commentary.

Schema: {"intents": string[], "coins": string[], "language": string, "complexity": "simple" | "complex"}

Valid intents: PRICE, WHALE, NEWS, DEFI_TVL, STAKING, GOVERNANCE.
Intent rules — ONLY include an intent if explicitly requested:
- NEWS: only when user asks for news/headlines/updates/what's happening
- WHALE: only when user asks about whales/large transactions/big moves
- DEFI_TVL: only when user asks about DeFi/TVL/protocols/liquidity
- STAKING: only when user asks about staking/yields/APY/rewards
- PRICE: default for any coin price, market, bullish/bearish, value question

Coin rules: output the canonical CoinGecko slug.
Common mappings — "btc"→"bitcoin", "eth"→"ethereum", "sol"→"solana", "apt"→"aptos", "sui"→"sui", "near"→"near", "arb"→"arbitrum", "op"→"optimism", "avax"→"avalanche-2", "matic"→"matic-network", "inj"→"injective-protocol", "tia"→"celestia", "jup"→"jupiter-exchange-solana", "wif"→"dogwifcoin", "bonk"→"bonk", "pepe"→"pepe", "ldo"→"lido-dao", "link"→"chainlink", "uni"→"uniswap", "mkr"→"maker", "doge"→"dogecoin", "shib"→"shiba-inu", "ada"→"cardano", "xrp"→"ripple", "dot"→"polkadot", "ltc"→"litecoin", "atom"→"cosmos", "ftm"→"fantom", "algo"→"algorand", "icp"→"internet-computer", "hbar"→"hedera-hashgraph", "stx"→"stacks", "sei"→"sei-network", "pyth"→"pyth-network". If unsure of slug, output the lowercase ticker — the fetcher will resolve it.

Complexity rules:
- "simple": single-intent factual lookup. Examples: "BTC price", "latest news", "top staking yields", "ETH market cap", "is ETH bullish today".
- "complex": multi-step reasoning, comparison, explanation, "should I worry about X", "compare A vs B", "what's happening with [niche protocol]", "explain [concept]", "deep dive on X", queries that span multiple data types in a non-obvious way, or any query about a token you're unsure how to slug. When in doubt between simple/complex, choose complex.

Language: en (English), hi (Hindi/Devanagari), bn (Bengali). Default en.`;

export async function classifyIntent(query: string): Promise<RouteDecision> {
  try {
    const msg = await getClient().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 250,
      system: CLASSIFIER_SYSTEM,
      messages: [{ role: 'user', content: query }],
    });

    const block = msg.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') return DEFAULT_ROUTE;

    const text = block.text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(text) as Partial<RouteDecision>;

    return {
      intents: Array.isArray(parsed.intents) && parsed.intents.length
        ? (parsed.intents as IntentResult['intents'])
        : DEFAULT_ROUTE.intents,
      coins: Array.isArray(parsed.coins) && parsed.coins.length
        ? parsed.coins
        : DEFAULT_ROUTE.coins,
      language: (['en', 'hi', 'bn'] as Language[]).includes(parsed.language as Language)
        ? (parsed.language as Language)
        : 'en',
      complexity: parsed.complexity === 'complex' ? 'complex' : 'simple',
    };
  } catch {
    return DEFAULT_ROUTE;
  }
}

// ─── 2. Agentic loop (complex queries) ─────────────────────────────────────────

const MAX_ITERATIONS = 5;

const RESEARCHER_SYSTEM = (langName: string) => `You are ChainPulse, a senior crypto research analyst who has lived through multiple market cycles. You think in fundamentals — token unlocks, real revenue, sustainable yield vs Ponzinomics, cycle psychology, regulatory headwinds. You know the ethos of every major chain (Ethereum's decentralization-first, Solana's throughput-first, Cosmos sovereignty, Bitcoin monetary thesis, Move-based VMs on Aptos/Sui, modular DA on Celestia, restaking on EigenLayer) and you do not tribalize.

Respond in ${langName}.

RESEARCH DOCTRINE:
- Use tools to fetch live data whenever the user asks about prices, TVL, whales, yields, or news. Never guess a price from memory.
- If a tool returns "no data" for a token the user named, try a different slug (e.g. fall back to lowercase ticker). If still empty, say so plainly.
- Don't over-fetch. Call only the tools needed to answer the question.
- For comparison questions ("Aave vs Compound"), fetch TVL once and infer from that — don't call the same tool twice with different args unless necessary.

OUTPUT DOCTRINE:
- Default: 2–4 concise sentences. Numbers-first. Source-tagged.
- Elaborate only when the query contains: "explain", "deep dive", "compare", "details", "walk me through", "why", "how does", or asks for a list/comparison of 3+ items.
- Lists when comparing ≥3 items, prose otherwise. Use **bold** for key terms/numbers.
- No headers (#, ##, ###). No blockquotes. Plain markdown only.
- Tag claims:
  • "(live)" for data you fetched via tools
  • "(general knowledge)" for facts from your training that aren't time-sensitive (e.g. "Aptos uses Move language")
  • "(unconfirmed)" for inferred or older numbers you can't verify live
- NEVER fabricate exact prices, market caps, TVLs, APYs, or addresses. If you lack live data for something, say so and offer to fetch.
- NEVER give financial advice. Educate. Always include a single ⚠ closing line if your answer touches prices, yields, or risk.

STYLE:
- No hedging filler ("it's worth noting", "as you may know", "as an AI"). Just say it.
- No throat-clearing intros. Lead with the answer.
- Keep total response under 200 words unless the user explicitly asked for depth.`;

export interface AgentRunResult {
  summary: string;
  data: Partial<QueryResponse>;
  errors: Record<string, string>;
  iterations: number;
}

export async function runAgentLoop(
  query: string,
  language: Language,
  history: HistoryTurn[] = [],
): Promise<AgentRunResult> {
  const langName = language === 'hi' ? 'Hindi' : language === 'bn' ? 'Bengali' : 'English';
  const client = getClient();

  // Build conversation history (text-only)
  const historyMessages: Anthropic.MessageParam[] = history.slice(-4).map((h) => ({
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

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    iterations = i + 1;

    let response: Anthropic.Message;
    try {
      response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: RESEARCHER_SYSTEM(langName),
        tools: TOOL_DEFS,
        messages,
      });
    } catch (err) {
      errors.agent = err instanceof Error ? err.message : 'agent call failed';
      break;
    }

    // Append assistant turn (preserves tool_use blocks for the next call)
    messages.push({ role: 'assistant', content: response.content });

    // Collect any text the model produced this turn — last non-empty wins
    const textPieces = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text.trim())
      .filter(Boolean);
    if (textPieces.length) summary = textPieces.join('\n\n');

    // No tool calls → model is done
    if (response.stop_reason !== 'tool_use') break;

    const toolBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    );
    if (!toolBlocks.length) break;

    // Execute all tool calls this turn in parallel
    const results = await Promise.all(
      toolBlocks.map(async (tb) => {
        const exec = await executeTool(tb.name, tb.input);
        // Merge data + collect errors
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

/** Merge tool output into the accumulator (concat arrays, prefer non-empty). */
function mergeData(
  current: Partial<QueryResponse>,
  patch: Partial<QueryResponse>,
): Partial<QueryResponse> {
  const out = { ...current };
  if (patch.price?.length)   out.price   = [...(current.price ?? []),   ...patch.price];
  if (patch.whale?.length)   out.whale   = [...(current.whale ?? []),   ...patch.whale];
  if (patch.news?.length)    out.news    = patch.news; // news is full-list replace
  if (patch.defi?.length)    out.defi    = patch.defi;
  if (patch.staking?.length) out.staking = patch.staking;
  return out;
}
