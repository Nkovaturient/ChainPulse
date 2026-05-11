'use client';

import type { Language, QueryResponse } from '@/types';
import SummaryCard from './cards/SummaryCard';
import PriceCard from './cards/PriceCard';
import WhaleCard from './cards/WhaleCard';
import NewsCard from './cards/NewsCard';
import DefiCard from './cards/DefiCard';
import StakingCard from './cards/StakingCard';

interface Props {
  response: QueryResponse;
  lang: Language;
}

function ErrorNotice({ msg }: { msg: string }) {
  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-2 text-xs text-red-400">
      {msg}
    </div>
  );
}

export default function ResponseFeed({ response, lang }: Props) {
  const errors = response.errors || {};
  return (
    <div className="space-y-4">
      <SummaryCard summary={response.summary} lang={lang} />
      {response.price?.length   && <PriceCard data={response.price} lang={lang} />}
      {errors.price             && <ErrorNotice msg={`Price: ${errors.price}`} />}
      {response.whale?.length   && <WhaleCard data={response.whale} lang={lang} />}
      {(errors.whale_eth || errors.whale_sol) && (
        <ErrorNotice msg={`Whale: ${errors.whale_eth || errors.whale_sol}`} />
      )}
      {response.news?.length    && <NewsCard data={response.news} lang={lang} />}
      {errors.news              && <ErrorNotice msg={`News: ${errors.news}`} />}
      {response.defi?.length    && <DefiCard data={response.defi} lang={lang} />}
      {errors.defi              && <ErrorNotice msg={`DeFi: ${errors.defi}`} />}
      {response.staking?.length && <StakingCard data={response.staking} lang={lang} />}
      {errors.staking           && <ErrorNotice msg={`Staking: ${errors.staking}`} />}
    </div>
  );
}
