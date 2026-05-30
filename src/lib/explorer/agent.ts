/**
 * Explorer-scoped agent: answers natural-language questions about a specific wallet.
 * Snapshot-first architecture — tools only for drill-down the snapshot lacks.
 */
import Anthropic from '@anthropic-ai/sdk';
import type { Language } from '@/types';
import { buildExplorerSystem, languageName } from '@/lib/agent-prompts';
import { MODELS, TOKEN_BUDGETS, CONTEXT_LIMITS } from '@/lib/agent-config';
import { trimHistoryForModel } from '@/lib/history-context';
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
      'Current native-token balance for this wallet on one chain.\n' +
      'Returns: chain, amount (human-readable), symbol (ETH/BNB/POL/AVAX), pricePerUnit, usdValue.\n' +
      'USE WHEN: snapshot per-chain balance is missing/stale, or user asks about one chain in isolation.\n' +
      'DO NOT USE: when snapshot already has accurate perChain.totalUsd for that chain.',
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
      'Native transactions for this wallet on one chain (newest first).\n' +
      'Returns: hash, from, to, valueNative, valueUsd, timestamp, direction (in/out).\n' +
      'USE WHEN: "biggest tx", "last activity", "what did this wallet do recently", time-bounded activity.\n' +
      'DO NOT USE: ERC-20 token history (use get_token_transfers).',
    input_schema: {
      type: 'object',
      properties: {
        chain: { type: 'string', enum: CHAINS.map((c) => c.key) },
        limit: { type: 'number', description: 'Max 25. Default 10.', default: 10 },
      },
      required: ['chain'],
    },
  },
  {
    name: 'get_token_transfers',
    description:
      'ERC-20 token transfers for this wallet on one chain (newest first).\n' +
      'Returns: token symbol, amount, from, to, timestamp, direction.\n' +
      'USE WHEN: stablecoin holdings/flows, airdrop detection, "what tokens", DeFi interaction history.\n' +
      'DO NOT USE: native ETH/gas txs (use get_recent_transactions).',
    input_schema: {
      type: 'object',
      properties: {
        chain: { type: 'string', enum: CHAINS.map((c) => c.key) },
        limit: { type: 'number', description: 'Max 100. Default 25.', default: 25 },
      },
      required: ['chain'],
    },
  },
];

function wrapPayload(source: string, data: unknown): string {
  return JSON.stringify({ source, fetchedAt: new Date().toISOString(), data });
}

interface ExecResult {
  payload: string;
  error?: { key: string; msg: string };
}

async function executeTool(name: string, input: unknown, address: string): Promise<ExecResult> {
  const args = (input ?? {}) as Record<string, unknown>;
  const chain = String(args.chain ?? '');
  if (!isChainKey(chain)) {
    return { payload: wrapPayload('explorer', { error: 'invalid chain' }) };
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
          payload: wrapPayload('etherscan', {
            chain,
            amount: amount ?? 0,
            symbol: CHAINS.find((c) => c.key === chain)!.nativeSymbol,
            pricePerUnit: price,
            usdValue: (amount ?? 0) * Number(price),
          }),
        };
      }
      case 'get_recent_transactions': {
        const limit = Math.min(Number(args.limit ?? 10), 25);
        const txns = await getRecentTransactions(address, chain, limit);
        return { payload: wrapPayload('etherscan', txns) };
      }
      case 'get_token_transfers': {
        const limit = Math.min(Number(args.limit ?? 25), 100);
        const transfers = await getTokenTransfers(address, chain, limit);
        return { payload: wrapPayload('etherscan', transfers) };
      }
      default:
        return { payload: wrapPayload('explorer', { error: `unknown tool: ${name}` }) };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'fetch failed';
    return { payload: wrapPayload(name, { error: msg }), error: { key: name, msg } };
  }
}

export interface ExplorerAgentResult {
  summary: string;
  errors: Record<string, string>;
  iterations: number;
}

const MAX_ITERATIONS = CONTEXT_LIMITS.maxAgentIterations;

export async function runExplorerAgent(
  address: string,
  query: string,
  snapshot: WalletReport,
  history: Array<{ role: 'user' | 'assistant'; text: string }>,
  language: Language,
): Promise<ExplorerAgentResult> {
  const client = getClient();

  const trimmed = trimHistoryForModel(history);
  const historyMessages: Anthropic.MessageParam[] = trimmed.map((h) => ({
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
        model: MODELS.agent,
        max_tokens: TOKEN_BUDGETS.explorer,
        system: buildExplorerSystem(address, languageName(language), snapshot),
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
