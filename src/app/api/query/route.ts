import { classifyIntent } from '@/lib/agent';
import { fetchPrices } from '@/lib/fetchers/coingecko';
import { fetchWhaleTransactions } from '@/lib/fetchers/etherscan';
import { fetchSolanaTransactions } from '@/lib/fetchers/solscan';
import { fetchDefiTVL, fetchStakingYields } from '@/lib/fetchers/defillama';
import { fetchCryptoNews } from '@/lib/fetchers/news';
import { generateSummary, type HistoryTurn } from '@/lib/summarizer';
import { getSessionUser } from '@/lib/auth';
import {
  addMessage,
  autoTitleSession,
  createSession,
  getRecentContext,
} from '@/lib/chat-storage';
import type {
  PriceData,
  WhaleTransaction,
  NewsItem,
  DefiProtocol,
  StakingPool,
  QueryResponse,
  Language,
} from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: { query?: string; language?: Language; sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { query, language: clientLang, sessionId: incomingSessionId } = body;
  if (!query || typeof query !== 'string' || query.length > 500) {
    return Response.json({ error: 'Invalid query' }, { status: 400 });
  }

  // ── Auth + session resolution ──────────────────────────────────────────────
  const user = await getSessionUser();
  let sessionId = incomingSessionId ?? null;

  // If user is logged in and no session provided, create a new one
  if (user && !sessionId) {
    const session = await createSession(user.sub);
    sessionId = session.id;
  }

  // Pull conversation history for multi-turn context
  let history: HistoryTurn[] = [];
  if (user && sessionId) {
    history = await getRecentContext(sessionId, 4);
  }

  // ── Persist user message ───────────────────────────────────────────────────
  if (user && sessionId) {
    await addMessage(sessionId, 'user', query);
    // Auto-title on first message
    if (history.length === 0) {
      await autoTitleSession(sessionId, query);
    }
  }

  // ── Intent + parallel fetches ──────────────────────────────────────────────
  const intent = await classifyIntent(query);
  const lang: Language = intent.language || clientLang || 'en';

  const [priceRes, whaleEthRes, whaleSolRes, defiRes, stakingRes, newsRes] = await Promise.allSettled([
    intent.intents.includes('PRICE')
      ? fetchPrices(intent.coins.length ? intent.coins : ['bitcoin', 'ethereum'])
      : Promise.resolve([] as PriceData[]),
    intent.intents.includes('WHALE') ? fetchWhaleTransactions() : Promise.resolve([] as WhaleTransaction[]),
    intent.intents.includes('WHALE') ? fetchSolanaTransactions() : Promise.resolve([] as WhaleTransaction[]),
    intent.intents.includes('DEFI_TVL') ? fetchDefiTVL() : Promise.resolve([] as DefiProtocol[]),
    intent.intents.includes('STAKING') ? fetchStakingYields() : Promise.resolve([] as StakingPool[]),
    intent.intents.includes('NEWS') || intent.intents.includes('GOVERNANCE')
      ? fetchCryptoNews()
      : Promise.resolve([] as NewsItem[]),
  ]);

  const errors: Record<string, string> = {};
  const extract = <T>(res: PromiseSettledResult<T>, key: string): T | undefined => {
    if (res.status === 'rejected') { errors[key] = 'Fetch failed'; return undefined; }
    return res.value;
  };

  const priceData  = extract(priceRes,    'price')     as PriceData[]      | undefined;
  const whaleEth   = extract(whaleEthRes, 'whale_eth') as WhaleTransaction[] | undefined;
  const whaleSol   = extract(whaleSolRes, 'whale_sol') as WhaleTransaction[] | undefined;
  const newsData   = extract(newsRes,     'news')      as NewsItem[]        | undefined;
  const defiData   = extract(defiRes,     'defi')      as DefiProtocol[]    | undefined;
  const stakingData = extract(stakingRes, 'staking')   as StakingPool[]     | undefined;

  const whaleCombined = [...(whaleEth || []), ...(whaleSol || [])];

  const data: Partial<QueryResponse> = {
    price:   priceData   && priceData.length   ? priceData   : undefined,
    whale:   whaleCombined.length              ? whaleCombined : undefined,
    news:    newsData    && newsData.length    ? newsData    : undefined,
    defi:    defiData    && defiData.length    ? defiData    : undefined,
    staking: stakingData && stakingData.length ? stakingData : undefined,
  };

  // ── Generate summary with history ──────────────────────────────────────────
  const summary = await generateSummary(data, lang, query, history);
  const response: QueryResponse = { ...data, summary, language: lang, errors };

  // ── Persist assistant message ──────────────────────────────────────────────
  if (user && sessionId) {
    await addMessage(sessionId, 'assistant', summary, response);
  }

  return Response.json({ ...response, sessionId });
}
