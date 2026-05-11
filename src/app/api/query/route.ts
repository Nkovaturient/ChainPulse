import { classifyIntent } from '@/lib/agent';
import { fetchPrices } from '@/lib/fetchers/coingecko';
import { fetchWhaleTransactions } from '@/lib/fetchers/etherscan';
import { fetchSolanaTransactions } from '@/lib/fetchers/solscan';
import { fetchDefiTVL, fetchStakingYields } from '@/lib/fetchers/defillama';
import { fetchCryptoNews } from '@/lib/fetchers/news';
import { generateSummary } from '@/lib/summarizer';
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
  let body: { query?: string; language?: Language };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { query, language: clientLang } = body;
  if (!query || typeof query !== 'string' || query.length > 500) {
    return Response.json({ error: 'Invalid query' }, { status: 400 });
  }

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
    if (res.status === 'rejected') {
      errors[key] = 'Fetch failed';
      return undefined;
    }
    return res.value;
  };

  const priceData = extract(priceRes, 'price') as PriceData[] | undefined;
  const whaleEth = extract(whaleEthRes, 'whale_eth') as WhaleTransaction[] | undefined;
  const whaleSol = extract(whaleSolRes, 'whale_sol') as WhaleTransaction[] | undefined;
  const newsData = extract(newsRes, 'news') as NewsItem[] | undefined;
  const defiData = extract(defiRes, 'defi') as DefiProtocol[] | undefined;
  const stakingData = extract(stakingRes, 'staking') as StakingPool[] | undefined;

  const whaleCombined = [...(whaleEth || []), ...(whaleSol || [])];

  const data: Partial<QueryResponse> = {
    price: priceData && priceData.length ? priceData : undefined,
    whale: whaleCombined.length ? whaleCombined : undefined,
    news: newsData && newsData.length ? newsData : undefined,
    defi: defiData && defiData.length ? defiData : undefined,
    staking: stakingData && stakingData.length ? stakingData : undefined,
  };

  const summary = await generateSummary(data, lang, query);
  const response: QueryResponse = { ...data, summary, language: lang, errors };
  return Response.json(response);
}
