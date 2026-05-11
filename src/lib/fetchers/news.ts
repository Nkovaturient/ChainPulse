import type { NewsItem } from '@/types';

export async function fetchCryptoNews(): Promise<NewsItem[]> {
  const feeds = ['https://cointelegraph.com/rss', 'https://decrypt.co/feed'];
  const results = await Promise.allSettled(
    feeds.map((url) =>
      fetch(url, { headers: { 'User-Agent': 'ChainPulse/1.0' }, cache: 'no-store' }).then((r) => r.text())
    )
  );

  const items: NewsItem[] = [];
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    const xml = r.value;
    const blocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 6);
    for (const [, block] of blocks) {
      const title = (
        block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/s)?.[1] ||
        block.match(/<title>(.*?)<\/title>/s)?.[1] ||
        ''
      ).trim();
      const link = (block.match(/<link>(.*?)<\/link>/s)?.[1] || '').trim();
      const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/s)?.[1] || '').trim();
      if (title && link) {
        try {
          items.push({ title, link, pubDate, source: new URL(link).hostname });
        } catch {}
      }
    }
  }
  return items.slice(0, 8);
}
