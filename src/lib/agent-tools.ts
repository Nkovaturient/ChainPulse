/**
 * Tool definitions + dispatcher for the agentic research loop.
 *
 * Each tool wraps an existing fetcher. Descriptions follow a fixed schema so
 * the model knows when to call, what fields mean, and how to synthesize.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { fetchPrices } from '@/lib/fetchers/coingecko';
import { fetchWhaleTransactions } from '@/lib/fetchers/etherscan';
import { fetchSolanaTransactions } from '@/lib/fetchers/solscan';
import { fetchDefiTVL, fetchStakingYields } from '@/lib/fetchers/defillama';
import { fetchCryptoNews } from '@/lib/fetchers/news';
import { compactToolData } from '@/lib/compact-payload';
import type { QueryResponse } from '@/types';

export const TOOL_DEFS: Anthropic.Tool[] = [
  {
    name: 'get_prices',
    description:
      'Live spot market data from CoinGecko.\n' +
      'Returns per coin: id, symbol, name, usd (spot), usd_24h_change (%), usd_market_cap, sparkline (~168 hourly points, ~7 days).\n' +
      'USE WHEN: price, market cap, 24h performance, short-term trend from sparkline, comparing majors.\n' +
      'DO NOT USE: wallet balances (explorer), full backtests (sparkline is ~7d hourly — not daily OHLCV), or coins you can answer from a prior tool call in this turn.\n' +
      'SYNTHESIS: Compare 24h % vs sparkline slope; flag sharp moves vs drift. Note market-cap tier (mega >$100B, large >$10B, mid >$1B). Accepts tickers/slugs — resolver maps apt→aptos, wif→dogwifcoin, etc.',
    input_schema: {
      type: 'object',
      properties: {
        coins: {
          type: 'array',
          items: { type: 'string' },
          description: 'CoinGecko slugs or tickers, e.g. ["bitcoin", "eth", "aptos"]. Max ~5 per call.',
        },
      },
      required: ['coins'],
    },
  },
  {
    name: 'get_news',
    description:
      'Latest crypto headlines from Cointelegraph + Decrypt RSS (~8–10 items).\n' +
      'Returns per item: title, link, pubDate, source.\n' +
      'USE WHEN: user asks for news, headlines, updates, governance buzz, or "what happened today".\n' +
      'DO NOT USE: price/TVL questions with no news angle.\n' +
      'SYNTHESIS: Surface 1–2 highest-signal stories for on-chain/DeFi/market structure — explain why they matter, not a headline list.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_whale_transactions',
    description:
      'Recent large on-chain transfers: Ethereum (>10 ETH native) and/or Solana (large SOL moves).\n' +
      'Returns per tx: hash, from, to, value, chain, timestamp, explorerUrl.\n' +
      'USE WHEN: whale tracking, unusual flows, exchange deposits/withdrawals, "anything big moving".\n' +
      'DO NOT USE: wallet-specific history (use explorer) or price-only queries.\n' +
      'SYNTHESIS: Report size, chain, direction. Note exchange-bound vs wallet-to-wallet descriptively — not predictive.',
    input_schema: {
      type: 'object',
      properties: {
        chain: {
          type: 'string',
          enum: ['ethereum', 'solana', 'both'],
          description: 'Which chain(s) to scan for large transfers.',
        },
      },
      required: ['chain'],
    },
  },
  {
    name: 'get_defi_tvl',
    description:
      'Top DeFi protocols by TVL from DefiLlama.\n' +
      'Returns per protocol: name, tvl (USD), change_1d (%), category, url.\n' +
      'USE WHEN: TVL rankings, protocol dominance, DeFi market share, category leaders, "top protocols".\n' +
      'DO NOT USE: single-token price or wallet questions.\n' +
      'SYNTHESIS: Highlight top 3–5 + category concentration; interpret 1d change as flow signal, not investment advice.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_staking_yields',
    description:
      'Top staking / yield pools from DefiLlama (filtered toward lower IL-risk categories).\n' +
      'Returns per pool: project, symbol, apy (%), tvlUsd, chain.\n' +
      'USE WHEN: staking APY, yield comparison, "best yields", pool TVL context.\n' +
      'DO NOT USE: price-only or news queries.\n' +
      'SYNTHESIS: Pair APY with TVL and chain; name structural risks (smart contract, IL, bridge) — never recommend allocation.',
    input_schema: { type: 'object', properties: {} },
  },
];

/** Wrap fetcher output with source metadata; compact before model sees it. */
function wrapPayload(source: string, name: string, data: unknown): string {
  const compact = compactToolData(name, data);
  return JSON.stringify({
    source,
    fetchedAt: new Date().toISOString(),
    data: compact,
  });
}

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
          return { payload: wrapPayload('coingecko', name, { error: 'no coins specified' }), dataPatch: {} };
        }
        const data = await fetchPrices(coins);
        return {
          payload: wrapPayload('coingecko', name, data.length ? data : { error: 'no data returned for slug(s)' }),
          dataPatch: data.length ? { price: data } : {},
        };
      }

      case 'get_news': {
        const data = await fetchCryptoNews();
        return {
          payload: wrapPayload('rss', name, data.length ? data : { error: 'no headlines' }),
          dataPatch: data.length ? { news: data } : {},
        };
      }

      case 'get_whale_transactions': {
        const chain = String(input.chain ?? 'ethereum');
        const eth = chain === 'ethereum' || chain === 'both' ? await fetchWhaleTransactions() : [];
        const sol = chain === 'solana' || chain === 'both' ? await fetchSolanaTransactions() : [];
        const combined = [...eth, ...sol];
        return {
          payload: wrapPayload('etherscan+solscan', name, combined.length ? combined : { error: 'no large txns in window' }),
          dataPatch: combined.length ? { whale: combined } : {},
        };
      }

      case 'get_defi_tvl': {
        const data = await fetchDefiTVL();
        return {
          payload: wrapPayload('defillama', name, data.length ? data : { error: 'no TVL data' }),
          dataPatch: data.length ? { defi: data } : {},
        };
      }

      case 'get_staking_yields': {
        const data = await fetchStakingYields();
        return {
          payload: wrapPayload('defillama', name, data.length ? data : { error: 'no yield data' }),
          dataPatch: data.length ? { staking: data } : {},
        };
      }

      default:
        return {
          payload: wrapPayload('unknown', name, { error: `unknown tool: ${name}` }),
          dataPatch: {},
        };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'fetch failed';
    return {
      payload: wrapPayload(name, name, { error: msg }),
      dataPatch: {},
      error: { key: name, msg },
    };
  }
}
