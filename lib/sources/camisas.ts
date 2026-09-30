import * as cheerio from 'cheerio';
import type { ArchiveItem } from '../types';
import { absoluteUrl, cleanText } from '../html';

const BASE = 'https://www.camisasdogremio.net/';

export async function fetchCamisasDoGremio(page = 1): Promise<ArchiveItem[]> {
  const url = page > 1 ? `${BASE}page/${page}/` : BASE;
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 ArchivoDigitalGremio educational research' }, cache: 'no-store' });
  if (!res.ok) throw new Error(`Camisas do Grêmio ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const items: ArchiveItem[] = [];

  $('article, .post, .type-post').each((i, el) => {
    const root = $(el);
    const heading = root.find('h1,h2,h3').first();
    const title = cleanText(heading.text());
    const href = absoluteUrl(BASE, heading.find('a').attr('href') || root.find('a').first().attr('href'));
    const year = Number((title.match(/(19|20)\d{2}/) || root.text().match(/(19|20)\d{2}/))?.[0]);
    if (!title || !year) return;
    const img = root.find('img').first();
    const src = absoluteUrl(BASE, img.attr('data-lazy-src') || img.attr('data-src') || img.attr('src'));
    const excerpt = cleanText(root.find('p').first().text()).slice(0, 320);
    items.push({
      id: `cdg-${page}-${i}-${year}`,
      kind: 'kit', yearStart: year, title,
      subtitle: 'Camisas do Grêmio', description: excerpt || null, sourceUrl: href || url,
      published: false,
      media: src ? [{ url: src, thumbUrl: src, alt: title, sourceUrl: href || url, rightsStatus: 'unknown' }] : [],
      metadata: { ingestion: 'reference-only', rightsNote: 'Não publicar automaticamente; confirmar autorização/licença.' }
    });
  });

  // fallback for themes without <article>
  if (!items.length) {
    $('h2 a, h3 a').each((i, el) => {
      const title = cleanText($(el).text());
      const year = Number(title.match(/(19|20)\d{2}/)?.[0]);
      if (!year) return;
      items.push({ id:`cdg-${page}-h-${i}-${year}`, kind:'kit', yearStart:year, title, subtitle:'Camisas do Grêmio', sourceUrl:absoluteUrl(BASE,$(el).attr('href')), published:false, metadata:{ ingestion:'reference-only' } });
    });
  }
  return items;
}
