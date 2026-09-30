import * as cheerio from 'cheerio';
import type { ArchiveItem } from '../types';
import { absoluteUrl, cleanText } from '../html';

const URL = 'https://www.footballkitarchive.com/pt/gremio-fbpa-camisas-t264/';

export async function fetchFootballKitArchive(): Promise<ArchiveItem[]> {
  const res = await fetch(URL, { headers: { 'user-agent': 'Mozilla/5.0 ArchivoDigitalGremio educational research' }, cache: 'no-store' });
  if (!res.ok) throw new Error(`Football Kit Archive ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const items: ArchiveItem[] = [];

  $('a').each((_, el) => {
    const a = $(el);
    const text = cleanText(a.text());
    const href = absoluteUrl(URL, a.attr('href'));
    const m = text.match(/Gr[eê]mio\s+FBPA\s+(19|20)\d{2}\s+(.+)/i);
    if (!m || !href || seen.has(href)) return;
    seen.add(href);
    const year = Number(text.match(/(19|20)\d{2}/)?.[0]);
    if (!year) return;
    const img = a.find('img').first();
    const src = absoluteUrl(URL, img.attr('data-src') || img.attr('src'));
    items.push({
      id: `fka-${Buffer.from(href).toString('base64url').slice(0,18)}`,
      kind: 'kit', yearStart: year, title: text,
      subtitle: 'Football Kit Archive', sourceUrl: href,
      published: false,
      media: src ? [{ url: src, thumbUrl: src, alt: text, sourceUrl: href, rightsStatus: 'unknown' }] : [],
      metadata: { ingestion: 'reference-only', rightsNote: 'Revisar licença/permissão antes de republicar a imagem.' }
    });
  });
  return items.sort((a,b) => b.yearStart - a.yearStart);
}
