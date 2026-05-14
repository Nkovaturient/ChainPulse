/**
 * Explorer-scoped agent: answers natural-language questions about a specific wallet.
 * Has access to wallet-inspection tools (balance, tokens, recent txns) across all
 * supported chains. Refuses to fabricate — only reports what the tools return.
 */
import Anthropic from '@anthropic-ai/sdk';
import type { Language } from '@/types';
import { CHAINS, type ChainKey, isChainKey } from './chains';
import {
  getNativeBalance,
  getRecentTransactions,
  getTokenTransfers,
} from './etherscan-v2';
import { fetchNativePrices } from './valuation';
import type { WalletReport } from './types';

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const TOOL_DEFS: Anthropic.Tool[] = [
  {
    name: 'get_native_balance',
    description:
      "Get the current native-token balance (ETH/BNB/POL/AVAX) of the wallet on a specific chain. " +
      "Returns the human-readable amount and USD value at current price.",
    input_schema: {
      type: 'object',
      properties: {
        chain: { type: 'string', enum: CHAINS.map((c) => c.key) },
      },
      required: ['chain'],
    },
  },
  {
    name: 'get_recent_transactions',
    description:
      "Get the most recent native transactions for the wallet on a specific chain (sorted newest first). " +
      "Use for 'what did this wallet do recently', 'biggest tx', 'last activity', etc.",
    input_schema: {
      type: 'object',
      properties: {
        chain: { type: 'string', enum: CHAINS.map((c) => c.key) },
        limit: { type: 'number', description: 'How many to fetch, max 25', default: 10 },
      },
      required: ['chain'],
    },
  },
  {
    name: 'get_token_transfers',
    description:
      "Get recent ERC-20 token transfers for the wallet on a specific chain. " +
      "Use to enumerate what tokens the wallet has interacted with, or to spot stablecoin/airdrop activity.",
    input_schema: {
      type: 'object',
      properties: {
        chain: { type: 'string', enum: CHAINS.map((c) => c.key) },
        limit: { type: 'number', description: 'How many to fetch, max 100', default: 25 },
      },
      required: ['chain'],
    },
  },
];

const SYSTEM = (address: string, langName: string, snapshot: WalletReport) => `You are ChainPulse Explorer, a forensic on-chain analyst. The user is asking about wallet address: ${address}

You have already been given a SNAPSHOT of this wallet's current state across all supported chains (Ethereum, Base, Arbitrum, Optimism, Polygon, BSC, Avalanche). Use the snapshot first — only call tools when the user asks for something the snapshot doesn't contain (e.g. drilling into specific txns, looking up more transfers, checking a chain in detail).

SNAPSHOT (compact JSON):
${JSON.stringify({
  netWorthUsd: Math.round(snapshot.netWorthUsd * 100) / 100,
  perChain: snapshot.perChain.map((p) => ({
    chain: p.chain,
    totalUsd: Math.round(p.totalUsd * 100) / 100,
    txCount: p.txCount,
    lastActive: p.lastActive,
  })),
  topTokens: snapshot.tokens.slice(0, 10).map((t) => ({
    chain: t.chain,
    symbol: t.symbol,
    amount: t.amount,
    usd: t.usd,
  })),
  recentActivity: snapshot.recentActivity.slice(0, 8).map((a) => ({
    chain: a.chain,
    direction: a.direction,
    valueNative: a.valueNative,
    valueUsd: a.valueUsd,
    timestamp: a.timestamp,
    hash: a.hash,
  })),
}, null, 2)}

Respond in ${langName}.

DOCTRINE:
- ONLY report facts present in the snapshot or returned by tools. NEVER invent balances, tx hashes, counterparties, or addresses.
- When asked about a specific token/protocol the snapshot doesn't mention, call the appropriate tool. If still no data, say "no on-chain activity found for that".
- Be concrete: cite chain names, exact USD figures, timestamps. Format numbers with thousands separators where helpful.
- Default response: 2-4 sentences. Lists only when comparing ≥3 items.
- Use **bold** for chain names, token symbols, and key numbers.
- No headers (#, ##). No throat-clearing intros. Lead with the answer.
- If the wallet appears empty or dormant on the queried chains, say so plainly.
- Always end with a single ⚠ line if the user asks for trading/risk inference. Never give financial advice.

The wallet address is fixed for this conversation — do not ask the user to re-supply it.`;

interface ExecResult {
  payload: string;
  error?: { key: string; msg: string };
}

async function executeTool(name: string, input: unknown, address: string): Promise<ExecResult> {
  const args = (input ?? {}) as Record<string, unknown>;
  const chain = String(args.chain ?? '');
  if (!isChainKey(chain)) {
    return { payload: JSON.stringify({ error: 'invalid chain' }) };
  }

  try {
    switch (name) {
      case 'get_native_balance': {
        const [amount, prices] = await Promise.all([
          getNativeBalance(address, chain),
          fetchNativePrices(),
        ]);
        const price = prices[chain] ?? 0;
        return {
          payload: JSON.stringify({
            chain,
            amount: amount ?? 0,
            symbol: CHAINS.find((c) => c.key === chain)!.nativeSymbol,
            pricePerUnit: price,
            usdValue: (amount ?? 0) * price,
          }),
        };
      }
      case 'get_recent_transactions': {
        const limit = Math.min(Number(args.limit ?? 10), 25);
        const txns = await getRecentTransactions(address, chain, limit);
        return { payload: JSON.stringify(txns) };
      }
      case 'get_token_transfers': {
        const limit = Math.min(Number(args.limit ?? 25), 100);
        const transfers = await getTokenTransfers(address, chain, limit);
        return { payload: JSON.stringify(transfers) };
      }
      default:
        return { payload: JSON.stringify({ error: `unknown tool: ${name}` }) };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'fetch failed';
    return { payload: JSON.stringify({ error: msg }), error: { key: name, msg } };
  }
}

export interface ExplorerAgentResult {
  summary: string;
  errors: Record<string, string>;
  iterations: number;
}

const MAX_ITERATIONS = 4;

export async function runExplorerAgent(
  address: string,
  query: string,
  snapshot: WalletReport,
  history: Array<{ role: 'user' | 'assistant'; text: string }>,
  language: Language,
): Promise<ExplorerAgentResult> {
  const langName = language === 'hi' ? 'Hindi' : language === 'bn' ? 'Bengali' : 'English';
  const client = getClient();

  const historyMessages: Anthropic.MessageParam[] = history.slice(-4).map((h) => ({
    role: h.role, content: h.text,
  }));
  const messages: Anthropic.MessageParam[] = [
    ...historyMessages,
    { role: 'user', content: query },
  ];

  const errors: Record<string, string> = {};
  let summary = '';
  let iterations = 0;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    iterations = i + 1;
    let response: Anthropic.Message;
    try {
      response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 900,
        system: SYSTEM(address, langName, snapshot),
        tools: TOOL_DEFS,
        messages,
      });
    } catch (err) {
      errors.agent = err instanceof Error ? err.message : 'agent call failed';
      break;
    }

    messages.push({ role: 'assistant', content: response.content });

    const textPieces = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text.trim())
      .filter(Boolean);
    if (textPieces.length) summary = textPieces.join('\n\n');

    if (response.stop_reason !== 'tool_use') break;
    const toolBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    );
    if (!toolBlocks.length) break;

    const results = await Promise.all(
      toolBlocks.map(async (tb) => {
        const r = await executeTool(tb.name, tb.input, address);
        if (r.error) errors[r.error.key] = r.error.msg;
        return {
          type: 'tool_result' as const,
          tool_use_id: tb.id,
          content: r.payload,
        };
      }),
    );
    messages.push({ role: 'user', content: results });
  }

  return { summary: summary.trim(), errors, iterations };
}

export function chainKeysFromQuery(query: string): ChainKey[] | undefined {
  const q = query.toLowerCase();
  const matched: ChainKey[] = [];
  for (const c of CHAINS) {
    if (q.includes(c.key) || q.includes(c.short.toLowerCase()) || q.includes(c.name.toLowerCase())) {
      matched.push(c.key);
    }
  }
  return matched.length ? matched : undefined;
}
