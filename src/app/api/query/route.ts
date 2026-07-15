import { classifyIntent, runAgentLoop } from '@/lib/agent';
import { fetchPrices } from '@/lib/fetchers/coingecko';
import { fetchWhaleTransactions } from '@/lib/fetchers/etherscan';
import { fetchSolanaTransactions } from '@/lib/fetchers/solscan';
import { fetchDefiTVL, fetchStakingYields } from '@/lib/fetchers/defillama';
import { fetchCryptoNews } from '@/lib/fetchers/news';
import { generateSummary, type HistoryTurn } from '@/lib/summarizer';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  addMessage,
  autoTitleSession,
  createSession,
  getRecentContext,
} from '@/lib/chat-storage';
import { computeEntitlements } from '@/lib/tier';
import { checkAndConsumeQuota } from '@/lib/rate-limit';
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

  // ── Auth + session ─────────────────────────────────────────────────────────
  const user = await getSessionUser();
  let sessionId = incomingSessionId ?? null;
  if (user && !sessionId) {
    const s = await createSession(user.sub, 'New chat', 'console');
    sessionId = s.id;
  }

  // ── Rate-limit check ───────────────────────────────────────────────────────
  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.sub },
      select: { premiumExpiresAt: true, eliteExpiresAt: true },
    });
    const ent = computeEntitlements({
      premiumExpiresAt: dbUser?.premiumExpiresAt?.toISOString() ?? null,
      eliteExpiresAt: dbUser?.eliteExpiresAt?.toISOString() ?? null,
    });
    const quota = await checkAndConsumeQuota(user.sub, ent, 'console');
    if (!quota.allowed) {
      return Response.json(
        { error: 'Message limit reached. Upgrade to send more.', resetAt: quota.resetAt, limit: quota.limit },
        { status: 429 },
      );
    }
  }

  let history: HistoryTurn[] = [];
  if (user && sessionId) history = await getRecentContext(sessionId, 4);

  if (user && sessionId) {
    await addMessage(sessionId, 'user', query);
    if (history.length === 0) await autoTitleSession(sessionId, query);
  }

  // ── Route: classify intent + complexity ────────────────────────────────────
  const route = await classifyIntent(query);
  const lang: Language = route.language || clientLang || 'en';

  // ── Branch on complexity ───────────────────────────────────────────────────
  let response: QueryResponse;

  if (route.complexity === 'complex') {
    const result = await runAgentLoop(query, lang, history);
    response = {
      ...result.data,
      summary: result.summary,
      language: lang,
      errors: result.errors,
    };
  } else {
    const [priceRes, whaleEthRes, whaleSolRes, defiRes, stakingRes, newsRes] =
      await Promise.allSettled([
        route.intents.includes('PRICE')
          ? fetchPrices(route.coins.length ? route.coins : ['bitcoin', 'ethereum'])
          : Promise.resolve([] as PriceData[]),
        route.intents.includes('WHALE') ? fetchWhaleTransactions() : Promise.resolve([] as WhaleTransaction[]),
        route.intents.includes('WHALE') ? fetchSolanaTransactions() : Promise.resolve([] as WhaleTransaction[]),
        route.intents.includes('DEFI_TVL') ? fetchDefiTVL() : Promise.resolve([] as DefiProtocol[]),
        route.intents.includes('STAKING') ? fetchStakingYields() : Promise.resolve([] as StakingPool[]),
        route.intents.includes('NEWS') || route.intents.includes('GOVERNANCE')
          ? fetchCryptoNews()
          : Promise.resolve([] as NewsItem[]),
      ]);

    const errors: Record<string, string> = {};
    const extract = <T>(res: PromiseSettledResult<T>, key: string): T | undefined => {
      if (res.status === 'rejected') { errors[key] = 'Fetch failed'; return undefined; }
      return res.value;
    };

    const priceData   = extract(priceRes,    'price')     as PriceData[]        | undefined;
    const whaleEth    = extract(whaleEthRes, 'whale_eth') as WhaleTransaction[] | undefined;
    const whaleSol    = extract(whaleSolRes, 'whale_sol') as WhaleTransaction[] | undefined;
    const newsData    = extract(newsRes,     'news')      as NewsItem[]         | undefined;
    const defiData    = extract(defiRes,     'defi')      as DefiProtocol[]     | undefined;
    const stakingData = extract(stakingRes,  'staking')   as StakingPool[]      | undefined;

    const whaleCombined = [...(whaleEth || []), ...(whaleSol || [])];

    const data: Partial<QueryResponse> = {
      price:   priceData    && priceData.length   ? priceData    : undefined,
      whale:   whaleCombined.length               ? whaleCombined : undefined,
      news:    newsData     && newsData.length    ? newsData     : undefined,
      defi:    defiData     && defiData.length    ? defiData     : undefined,
      staking: stakingData  && stakingData.length ? stakingData  : undefined,
    };

    const summary = await generateSummary(data, lang, query, history);
    response = { ...data, summary, language: lang, errors };
  }

  // ── Persist assistant message ──────────────────────────────────────────────
  let assistantMessageId: string | undefined;
  if (user && sessionId) {
    const stored = await addMessage(sessionId, 'assistant', response.summary, response);
    assistantMessageId = stored.id;
  }

  return Response.json({
    ...response,
    sessionId,
    assistantMessageId,
    mode: route.complexity,
  });
}
