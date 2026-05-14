/**
 * Tool definitions + dispatcher for the agentic research loop.
 *
 * Each tool wraps an existing fetcher. The model can call any combination
 * of these, see the results, then iterate or synthesize a final answer.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { fetchPrices } from '@/lib/fetchers/coingecko';
import { fetchWhaleTransactions } from '@/lib/fetchers/etherscan';
import { fetchSolanaTransactions } from '@/lib/fetchers/solscan';
import { fetchDefiTVL, fetchStakingYields } from '@/lib/fetchers/defillama';
import { fetchCryptoNews } from '@/lib/fetchers/news';
import type { QueryResponse } from '@/types';

export const TOOL_DEFS: Anthropic.Tool[] = [
  {
    name: 'get_prices',
    description:
      'Fetch live prices, 24h % change, market cap, and 7-day sparkline for one or more coins from CoinGecko. ' +
      'Accepts tickers or full names; the resolver maps "apt"→aptos, "wif"→dogwifcoin, etc. Use this for any price/market/bullish-bearish question.',
    input_schema: {
      type: 'object',
      properties: {
        coins: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tickers or CoinGecko slugs (e.g. ["btc", "eth", "aptos", "sui"]).',
        },
      },
      required: ['coins'],
    },
  },
  {
    name: 'get_news',
    description:
      'Fetch the latest 8–10 crypto news headlines from Cointelegraph + Decrypt RSS. ' +
      'Only call if user explicitly asks for news/headlines/updates.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_whale_transactions',
    description:
      'Fetch recent large on-chain transactions for either Ethereum (>10 ETH) or Solana. ' +
      'Use for whale-tracking, large flow, or "is anything big moving?" questions.',
    input_schema: {
      type: 'object',
      properties: {
        chain: { type: 'string', enum: ['ethereum', 'solana', 'both'] },
      },
      required: ['chain'],
    },
  },
  {
    name: 'get_defi_tvl',
    description:
      'Fetch top DeFi protocols by total value locked from DefiLlama. ' +
      'Use for TVL, protocol rankings, DeFi market share, or comparison questions.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_staking_yields',
    description:
      'Fetch top staking / yield pools (filtered for low impermanent-loss risk) from DefiLlama. ' +
      'Use for APY, staking, yield-farming questions.',
    input_schema: { type: 'object', properties: {} },
  },
];

/** Result of executing a tool — includes the raw payload (for the model) and a slice
 *  of QueryResponse data (for the UI to render data cards). */
export interface ToolExecResult {
  /** Stringified JSON payload returned to the model */
  payload: string;
  /** Partial data to merge into the final QueryResponse */
  dataPatch: Partial<QueryResponse>;
  /** Error key/message if the underlying fetcher failed */
  error?: { key: string; msg: string };
}

export async function executeTool(
  name: string,
  rawInput: unknown,
): Promise<ToolExecResult> {
  const input = (rawInput ?? {}) as Record<string, unknown>;

  try {
    switch (name) {
      case 'get_prices': {
        const coins = Array.isArray(input.coins) ? (input.coins as string[]) : [];
        if (!coins.length) {
          return { payload: JSON.stringify({ error: 'no coins specified' }), dataPatch: {} };
        }
        const data = await fetchPrices(coins);
        return {
          payload: JSON.stringify(data.length ? data : { error: 'no data returned' }),
          dataPatch: data.length ? { price: data } : {},
        };
      }

      case 'get_news': {
        const data = await fetchCryptoNews();
        return {
          payload: JSON.stringify(data.length ? data : { error: 'no headlines' }),
          dataPatch: data.length ? { news: data } : {},
        };
      }

      case 'get_whale_transactions': {
        const chain = String(input.chain ?? 'ethereum');
        const eth = chain === 'ethereum' || chain === 'both' ? await fetchWhaleTransactions() : [];
        const sol = chain === 'solana' || chain === 'both' ? await fetchSolanaTransactions() : [];
        const combined = [...eth, ...sol];
        return {
          payload: JSON.stringify(combined.length ? combined : { error: 'no large txns' }),
          dataPatch: combined.length ? { whale: combined } : {},
        };
      }

      case 'get_defi_tvl': {
        const data = await fetchDefiTVL();
        return {
          payload: JSON.stringify(data.length ? data : { error: 'no TVL data' }),
          dataPatch: data.length ? { defi: data } : {},
        };
      }

      case 'get_staking_yields': {
        const data = await fetchStakingYields();
        return {
          payload: JSON.stringify(data.length ? data : { error: 'no yield data' }),
          dataPatch: data.length ? { staking: data } : {},
        };
      }

      default:
        return {
          payload: JSON.stringify({ error: `unknown tool: ${name}` }),
          dataPatch: {},
        };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'fetch failed';
    return {
      payload: JSON.stringify({ error: msg }),
      dataPatch: {},
      error: { key: name, msg },
    };
  }
}
